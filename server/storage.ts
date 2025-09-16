import { type Document, type InsertDocument, type FieldMapping, type InsertFieldMapping, type RuleTransformation, type InsertRuleTransformation } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Document operations
  createDocument(document: InsertDocument): Promise<Document>;
  getDocument(id: string): Promise<Document | undefined>;
  updateDocument(id: string, updates: Partial<Document>): Promise<Document | undefined>;
  listDocuments(): Promise<Document[]>;
  
  // Field mapping operations
  createFieldMapping(mapping: InsertFieldMapping): Promise<FieldMapping>;
  getFieldMappingsByDocument(documentId: string): Promise<FieldMapping[]>;
  updateFieldMapping(id: string, updates: Partial<FieldMapping>): Promise<FieldMapping | undefined>;
  
  // Rule transformation operations
  createRuleTransformation(rule: InsertRuleTransformation): Promise<RuleTransformation>;
  getRuleTransformationsByDocument(documentId: string): Promise<RuleTransformation[]>;
  updateRuleTransformation(id: string, updates: Partial<RuleTransformation>): Promise<RuleTransformation | undefined>;
}

export class MemStorage implements IStorage {
  private documents: Map<string, Document>;
  private fieldMappings: Map<string, FieldMapping>;
  private ruleTransformations: Map<string, RuleTransformation>;

  constructor() {
    this.documents = new Map();
    this.fieldMappings = new Map();
    this.ruleTransformations = new Map();
  }

  async createDocument(insertDocument: InsertDocument): Promise<Document> {
    const id = randomUUID();
    const now = new Date();
    const document: Document = { 
      ...insertDocument,
      id, 
      status: insertDocument.status || 'pending',
      jsonTemplate: insertDocument.jsonTemplate || null,
      excelMetadata: insertDocument.excelMetadata || null,
      fieldMappings: insertDocument.fieldMappings || null,
      transformedRules: insertDocument.transformedRules || null,
      documentPath: insertDocument.documentPath || null,
      createdAt: now, 
      updatedAt: now 
    };
    this.documents.set(id, document);
    return document;
  }

  async getDocument(id: string): Promise<Document | undefined> {
    return this.documents.get(id);
  }

  async updateDocument(id: string, updates: Partial<Document>): Promise<Document | undefined> {
    const document = this.documents.get(id);
    if (!document) return undefined;
    
    const updated = { ...document, ...updates, updatedAt: new Date() };
    this.documents.set(id, updated);
    return updated;
  }

  async listDocuments(): Promise<Document[]> {
    return Array.from(this.documents.values()).sort((a, b) => 
      new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime()
    );
  }

  async createFieldMapping(insertMapping: InsertFieldMapping): Promise<FieldMapping> {
    const id = randomUUID();
    const now = new Date();
    const mapping: FieldMapping = { 
      ...insertMapping,
      id,
      documentId: insertMapping.documentId || null,
      isAccepted: insertMapping.isAccepted || null,
      createdAt: now 
    };
    this.fieldMappings.set(id, mapping);
    return mapping;
  }

  async getFieldMappingsByDocument(documentId: string): Promise<FieldMapping[]> {
    return Array.from(this.fieldMappings.values()).filter(
      mapping => mapping.documentId === documentId
    );
  }

  async updateFieldMapping(id: string, updates: Partial<FieldMapping>): Promise<FieldMapping | undefined> {
    const mapping = this.fieldMappings.get(id);
    if (!mapping) return undefined;
    
    const updated = { ...mapping, ...updates };
    this.fieldMappings.set(id, updated);
    return updated;
  }

  async createRuleTransformation(insertRule: InsertRuleTransformation): Promise<RuleTransformation> {
    const id = randomUUID();
    const now = new Date();
    const rule: RuleTransformation = { 
      ...insertRule,
      id,
      documentId: insertRule.documentId || null,
      isAccepted: insertRule.isAccepted || null,
      createdAt: now 
    };
    this.ruleTransformations.set(id, rule);
    return rule;
  }

  async getRuleTransformationsByDocument(documentId: string): Promise<RuleTransformation[]> {
    return Array.from(this.ruleTransformations.values()).filter(
      rule => rule.documentId === documentId
    );
  }

  async updateRuleTransformation(id: string, updates: Partial<RuleTransformation>): Promise<RuleTransformation | undefined> {
    const rule = this.ruleTransformations.get(id);
    if (!rule) return undefined;
    
    const updated = { ...rule, ...updates };
    this.ruleTransformations.set(id, updated);
    return updated;
  }
}

export const storage = new MemStorage();
