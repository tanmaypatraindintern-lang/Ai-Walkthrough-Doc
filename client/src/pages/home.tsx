import { useState, useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { FileUpload } from '@/components/file-upload';
import { ProgressIndicator } from '@/components/progress-indicator';
import { StatusPanel } from '@/components/status-panel';
import { FieldMappingTable } from '@/components/field-mapping';
import { RulePreview } from '@/components/rule-preview';
import { Button } from '@/components/ui/button';
import { File, Settings } from 'lucide-react';
import { FileUploadState, WorkflowStep, FieldMapping, RuleTransformation } from '@/types';
import { uploadFiles, getDocument, updateFieldMapping, updateRuleTransformation, generateDocument } from '@/services/api';

export default function Home() {
  const [uploadState, setUploadState] = useState<FileUploadState>({
    jsonFile: null,
    excelFile: null,
    name: '',
    useLLM: false,
    confidenceThreshold: 0.7,
  });
  
  const [currentStep, setCurrentStep] = useState<WorkflowStep>('upload');
  const [canUpload, setCanUpload] = useState(false);
  const [documentId, setDocumentId] = useState<string | null>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch document data when we have a document ID
  const { data: documentData, isLoading: isLoadingDocument } = useQuery({
    queryKey: ['/api/documents', documentId],
    queryFn: () => getDocument(documentId!),
    enabled: !!documentId,
  });

  // Upload files mutation
  const uploadMutation = useMutation({
    mutationFn: uploadFiles,
    onSuccess: (data) => {
      setDocumentId(data.documentId);
      setCurrentStep('review');
      toast({
        title: 'Files processed successfully',
        description: `Found ${data.mappings.length} field mappings and ${data.transformedRules.length} rules.`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
    },
    onError: (error) => {
      toast({
        title: 'Upload failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Update field mapping mutation
  const updateMappingMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: any }) => 
      updateFieldMapping(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/documents', documentId] });
      toast({
        title: 'Mapping updated',
        description: 'Field mapping has been updated successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Update failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Update rule transformation mutation
  const updateRuleMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: any }) => 
      updateRuleTransformation(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/documents', documentId] });
      toast({
        title: 'Rule updated',
        description: 'Rule transformation has been updated successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Update failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Generate document mutation
  const generateMutation = useMutation({
    mutationFn: () => generateDocument(documentId!),
    onSuccess: (blob) => {
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `${uploadState.name}_reconciliation.docx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      setCurrentStep('generate');
      toast({
        title: 'Document generated',
        description: 'Word document has been generated and downloaded.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Generation failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleParseFiles = useCallback(() => {
    if (!canUpload) return;
    
    setCurrentStep('parse');
    uploadMutation.mutate({
      jsonFile: uploadState.jsonFile!,
      excelFile: uploadState.excelFile!,
      name: uploadState.name,
      useLLM: uploadState.useLLM,
      confidenceThreshold: uploadState.confidenceThreshold,
    });
  }, [uploadState, canUpload, uploadMutation]);

  const handleMapFields = useCallback(() => {
    // This would trigger re-processing with different settings
    if (documentId) {
      queryClient.invalidateQueries({ queryKey: ['/api/documents', documentId] });
    }
  }, [documentId, queryClient]);

  const handleGenerateDocument = useCallback(() => {
    if (!documentId) return;
    generateMutation.mutate();
  }, [documentId, generateMutation]);

  const handleUpdateMapping = useCallback((id: string, updates: any) => {
    updateMappingMutation.mutate({ id, updates });
  }, [updateMappingMutation]);

  const handleUpdateRule = useCallback((id: string, updates: any) => {
    updateRuleMutation.mutate({ id, updates });
  }, [updateRuleMutation]);

  const isProcessing = uploadMutation.isPending || updateMappingMutation.isPending || 
                      updateRuleMutation.isPending || generateMutation.isPending;

  const mappings: FieldMapping[] = documentData?.mappings || [];
  const rules: RuleTransformation[] = documentData?.rules || [];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <File className="text-primary-foreground h-4 w-4" />
              </div>
              <h1 className="text-xl font-semibold text-foreground">Reconciliation Doc Generator</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-muted-foreground">v1.0.0</span>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Progress Indicator */}
        <ProgressIndicator currentStep={currentStep} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* File Upload Section */}
          <div className="lg:col-span-2 space-y-6">
            <FileUpload
              value={uploadState}
              onChange={setUploadState}
              onValidationChange={setCanUpload}
            />
          </div>

          {/* Action Panel */}
          <div>
            <StatusPanel
              uploadState={uploadState}
              currentStep={currentStep}
              isProcessing={isProcessing}
              onParseFiles={handleParseFiles}
              onMapFields={handleMapFields}
              onGenerateDocument={handleGenerateDocument}
              canParse={canUpload}
              canMap={currentStep !== 'upload'}
              canGenerate={currentStep === 'review' && documentId !== null}
            />
          </div>
        </div>

        {/* Preview Section */}
        {(mappings.length > 0 || rules.length > 0) && (
          <div className="mt-8 space-y-6">
            <FieldMappingTable
              mappings={mappings}
              onUpdateMapping={handleUpdateMapping}
              isLoading={isProcessing}
            />
            
            <RulePreview
              rules={rules}
              onUpdateRule={handleUpdateRule}
              isLoading={isProcessing}
            />
          </div>
        )}
      </main>
    </div>
  );
}
