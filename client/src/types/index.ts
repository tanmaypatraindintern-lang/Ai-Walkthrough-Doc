export interface FileUploadState {
  jsonFile: File | null;
  excelFile: File | null;
  name: string;
  useLLM: boolean;
  confidenceThreshold: number;
}

export interface ParsedExcelData {
  sheetCount: number;
  sheetNames: string[];
  sheets: Record<string, {
    headers: string[];
    rowCount: number;
    sampleData: any[][];
  }>;
}

export interface FieldMapping {
  id?: string;
  jsonField: string;
  excelColumn: string;
  confidence: number;
  isAccepted?: number;
  status?: string;
}

export interface RuleTransformation {
  id?: string;
  original: string;
  transformed: string;
  confidence: number;
  isAccepted?: number;
}

export interface DocumentData {
  id: string;
  name: string;
  status: string;
  jsonTemplate?: any;
  excelMetadata?: ParsedExcelData;
  fieldMappings?: FieldMapping[];
  transformedRules?: RuleTransformation[];
  createdAt?: string;
}

export interface ProcessingResult {
  documentId: string;
  mappings: FieldMapping[];
  transformedRules: RuleTransformation[];
  status: string;
}

export type WorkflowStep = 'upload' | 'parse' | 'review' | 'generate';

export interface ConfidenceLevel {
  level: 'high' | 'medium' | 'low';
  color: string;
  threshold: number;
}
