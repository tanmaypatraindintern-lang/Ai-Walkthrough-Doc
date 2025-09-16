import { apiRequest } from "@/lib/queryClient";

export interface UploadFilesRequest {
  jsonFile: File;
  excelFile: File;
  name: string;
  useLLM?: boolean;
  confidenceThreshold?: number;
}

export interface UploadFilesResponse {
  documentId: string;
  mappings: any[];
  transformedRules: any[];
  status: string;
}

export async function uploadFiles(data: UploadFilesRequest): Promise<UploadFilesResponse> {
  const formData = new FormData();
  formData.append('jsonFile', data.jsonFile);
  formData.append('excelFile', data.excelFile);
  formData.append('name', data.name);
  formData.append('useLLM', String(data.useLLM || false));
  formData.append('confidenceThreshold', String(data.confidenceThreshold || 0.7));

  const response = await fetch('/api/documents/upload', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Upload failed');
  }

  return response.json();
}

export async function getDocument(id: string) {
  const response = await apiRequest('GET', `/api/documents/${id}`);
  return response.json();
}

export async function updateFieldMapping(id: string, updates: { isAccepted?: number; excelColumn?: string }) {
  const response = await apiRequest('PATCH', `/api/field-mappings/${id}`, updates);
  return response.json();
}

export async function updateRuleTransformation(id: string, updates: { isAccepted?: number; transformedRule?: string }) {
  const response = await apiRequest('PATCH', `/api/rule-transformations/${id}`, updates);
  return response.json();
}

export async function generateDocument(documentId: string): Promise<Blob> {
  const response = await fetch(`/api/documents/${documentId}/generate`, {
    method: 'POST',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Document generation failed');
  }

  return response.blob();
}

export async function listDocuments() {
  const response = await apiRequest('GET', '/api/documents');
  return response.json();
}
