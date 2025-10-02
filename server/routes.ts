import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import multer from "multer";
import * as XLSX from "xlsx";
import { Document, Packer, Paragraph, HeadingLevel, Table, TableRow, TableCell } from "docx";
import fs from "fs/promises";
import path from "path";
import { insertDocumentSchema } from "@shared/schema";
import stringSimilarity from "string-similarity";

// Configure multer for file uploads
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Utility functions
function parseJsonTemplate(buffer: Buffer): any {
  try {
    const content = buffer.toString('utf-8');
    return JSON.parse(content);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Invalid JSON format: ${errorMessage}`);
  }
}

function parseExcelFile(buffer: Buffer): any {
  try {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheets: any = {};
    
    workbook.SheetNames.forEach(sheetName => {
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      const headers = data[0] as string[] || [];
      const rows = data.slice(1);
      
      sheets[sheetName] = {
        headers,
        rowCount: rows.length,
        sampleData: rows.slice(0, 5) // First 5 rows as sample
      };
    });
    
    return {
      sheetCount: workbook.SheetNames.length,
      sheetNames: workbook.SheetNames,
      sheets
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Invalid Excel format: ${errorMessage}`);
  }
}

function extractJsonFields(jsonData: any): string[] {
  const fields: string[] = [];
  
  function traverse(obj: any, path: string = '') {
    if (typeof obj === 'object' && obj !== null) {
      if (Array.isArray(obj)) {
        obj.forEach((item, index) => {
          traverse(item, path ? `${path}[${index}]` : `[${index}]`);
        });
      } else {
        Object.keys(obj).forEach(key => {
          const currentPath = path ? `${path}.${key}` : key;
          if (typeof obj[key] === 'string' || typeof obj[key] === 'number') {
            fields.push(currentPath);
          } else {
            traverse(obj[key], currentPath);
          }
        });
      }
    }
  }
  
  traverse(jsonData);
  return fields;
}

function performFieldMapping(jsonFields: string[], excelColumns: string[], threshold: number = 0.7): any[] {
  const mappings: any[] = [];
  
  jsonFields.forEach(jsonField => {
    const matches = stringSimilarity.findBestMatch(jsonField, excelColumns);
    const bestMatch = matches.bestMatch;
    
    if (bestMatch.rating >= threshold) {
      mappings.push({
        jsonField,
        excelColumn: bestMatch.target,
        confidence: Math.round(bestMatch.rating * 100) / 100,
        status: 'suggested'
      });
    }
  });
  
  return mappings.sort((a, b) => b.confidence - a.confidence);
}

function extractRulesFromJson(jsonData: any): string[] {
  const rules: string[] = [];
  
  function findRules(obj: any) {
    if (typeof obj === 'object' && obj !== null) {
      if (Array.isArray(obj)) {
        obj.forEach(item => findRules(item));
      } else {
        Object.keys(obj).forEach(key => {
          if (key.toLowerCase().includes('rule') || key.toLowerCase().includes('condition') || key.toLowerCase().includes('validation')) {
            if (typeof obj[key] === 'string') {
              rules.push(obj[key]);
            }
          }
          findRules(obj[key]);
        });
      }
    }
  }
  
  findRules(jsonData);
  return rules;
}

function transformRuleToPlainEnglish(rule: string): { transformed: string, confidence: number } {
  // Basic rule transformation logic
  let transformed = rule;
  let confidence = 0.8;
  
  // Replace operators
  transformed = transformed.replace(/!=/g, ' does not equal ');
  transformed = transformed.replace(/==/g, ' equals ');
  transformed = transformed.replace(/>/g, ' is greater than ');
  transformed = transformed.replace(/</g, ' is less than ');
  transformed = transformed.replace(/&&/g, ' and ');
  transformed = transformed.replace(/\|\|/g, ' or ');
  
  // Replace technical terms
  transformed = transformed.replace(/\bif\b/gi, 'If');
  transformed = transformed.replace(/\bthen\b/gi, ', then');
  transformed = transformed.replace(/\belse\b/gi, ', otherwise');
  
  // Handle common patterns
  if (transformed.includes('VLOOKUP') || transformed.includes('vlookup')) {
    transformed = 'This field uses a lookup table to find matching values.';
    confidence = 0.9;
  } else if (transformed.includes('CONCAT') || transformed.includes('concat')) {
    transformed = 'This field combines multiple values together.';
    confidence = 0.9;
  } else if (transformed.includes('SUM') || transformed.includes('sum')) {
    transformed = 'This field calculates the total sum of values.';
    confidence = 0.9;
  }
  
  return { transformed, confidence };
}

async function generateWordDocument(documentData: any, mappings: any[], rules: any[]): Promise<Buffer> {
  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        new Paragraph({
          text: "Reconciliation Document Summary",
          heading: HeadingLevel.HEADING_1,
        }),
        new Paragraph({
          text: `Generated on ${new Date().toLocaleDateString()}`,
          spacing: { after: 200 },
        }),
        
        new Paragraph({
          text: "Data Sources",
          heading: HeadingLevel.HEADING_2,
        }),
        new Paragraph({
          text: `JSON Template: ${documentData.name}`,
        }),
        new Paragraph({
          text: `Excel Document: Contains ${documentData.excelMetadata?.sheetCount || 0} sheets`,
          spacing: { after: 200 },
        }),
        
        new Paragraph({
          text: "Field Mappings",
          heading: HeadingLevel.HEADING_2,
        }),
        ...mappings.map(mapping => 
          new Paragraph({
            text: `• ${mapping.jsonField} → ${mapping.excelColumn} (${Math.round(mapping.confidence * 100)}% confidence)`,
          })
        ),
        
        new Paragraph({
          text: "Business Rules",
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200 },
        }),
        ...rules.map(rule => 
          new Paragraph({
            text: `• ${rule.transformedRule}`,
            spacing: { after: 100 },
          })
        ),
        
        new Paragraph({
          text: "Notes",
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200 },
        }),
        new Paragraph({
          text: "This document was automatically generated from the provided JSON template and Excel file. Please review all mappings and rules for accuracy before use in production.",
        }),
      ],
    }],
  });
  
  return await Packer.toBuffer(doc);
}

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Upload and parse files
  app.post("/api/documents/upload", upload.fields([
    { name: 'jsonFile', maxCount: 1 },
    { name: 'excelFile', maxCount: 1 }
  ]), async (req, res) => {
    try {
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      const { name, useLLM = false, confidenceThreshold = 0.7 } = req.body;
      
      if (!files.jsonFile || !files.excelFile || !name) {
        return res.status(400).json({ error: "Missing required files or name" });
      }
      
      // Parse files
      const jsonData = parseJsonTemplate(files.jsonFile[0].buffer);
      const excelData = parseExcelFile(files.excelFile[0].buffer);
      
      // Create document record
      const document = await storage.createDocument({
        name,
        status: "processing",
        jsonTemplate: jsonData,
        excelMetadata: excelData,
        fieldMappings: null,
        transformedRules: null,
        documentPath: null,
      });
      
      // Extract fields and perform mapping
      const jsonFields = extractJsonFields(jsonData);
      const allExcelColumns = Object.values(excelData.sheets)
        .flatMap((sheet: any) => sheet.headers)
        .filter(Boolean);
      
      const mappings = performFieldMapping(jsonFields, allExcelColumns, parseFloat(confidenceThreshold));
      
      // Save field mappings
      for (const mapping of mappings) {
        await storage.createFieldMapping({
          documentId: document.id,
          jsonField: mapping.jsonField,
          excelColumn: mapping.excelColumn,
          confidence: mapping.confidence,
          isAccepted: 0,
        });
      }
      
      // Extract and transform rules
      const rawRules = extractRulesFromJson(jsonData);
      const transformedRules = rawRules.map(rule => {
        const { transformed, confidence } = transformRuleToPlainEnglish(rule);
        return { original: rule, transformed, confidence };
      });
      
      // Save rule transformations
      for (const rule of transformedRules) {
        await storage.createRuleTransformation({
          documentId: document.id,
          originalRule: rule.original,
          transformedRule: rule.transformed,
          confidence: rule.confidence,
          isAccepted: 0,
        });
      }
      
      // Update document status
      await storage.updateDocument(document.id, { 
        status: "completed",
        fieldMappings: mappings,
        transformedRules: transformedRules 
      });
      
      res.json({
        documentId: document.id,
        mappings,
        transformedRules,
        status: "completed"
      });
      
    } catch (error) {
      console.error("Upload error:", error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ error: errorMessage });
    }
  });
  
  // Get document details
  app.get("/api/documents/:id", async (req, res) => {
    try {
      const document = await storage.getDocument(req.params.id);
      if (!document) {
        return res.status(404).json({ error: "Document not found" });
      }
      
      const mappings = await storage.getFieldMappingsByDocument(document.id);
      const rules = await storage.getRuleTransformationsByDocument(document.id);
      
      res.json({
        document,
        mappings,
        rules
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ error: errorMessage });
    }
  });
  
  // Update field mapping
  app.patch("/api/field-mappings/:id", async (req, res) => {
    try {
      const { isAccepted, excelColumn } = req.body;
      const mapping = await storage.updateFieldMapping(req.params.id, {
        isAccepted,
        excelColumn
      });
      
      if (!mapping) {
        return res.status(404).json({ error: "Mapping not found" });
      }
      
      res.json(mapping);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ error: errorMessage });
    }
  });
  
  // Update rule transformation
  app.patch("/api/rule-transformations/:id", async (req, res) => {
    try {
      const { isAccepted, transformedRule } = req.body;
      const rule = await storage.updateRuleTransformation(req.params.id, {
        isAccepted,
        transformedRule
      });
      
      if (!rule) {
        return res.status(404).json({ error: "Rule not found" });
      }
      
      res.json(rule);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ error: errorMessage });
    }
  });
  
  // Generate Word document
  app.post("/api/documents/:id/generate", async (req, res) => {
    try {
      const document = await storage.getDocument(req.params.id);
      if (!document) {
        return res.status(404).json({ error: "Document not found" });
      }
      
      const mappings = await storage.getFieldMappingsByDocument(document.id);
      const rules = await storage.getRuleTransformationsByDocument(document.id);
      
      const docBuffer = await generateWordDocument(document, mappings, rules);
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      res.setHeader('Content-Disposition', `attachment; filename="${document.name}_reconciliation.docx"`);
      res.send(docBuffer);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ error: errorMessage });
    }
  });
  
  // List all documents
  app.get("/api/documents", async (req, res) => {
    try {
      const documents = await storage.listDocuments();
      res.json(documents);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ error: errorMessage });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
