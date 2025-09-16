import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Play, RotateCcw, FileText, CheckCircle, XCircle, Clock, Settings } from 'lucide-react';
import { FileUploadState, WorkflowStep } from '@/types';

interface StatusPanelProps {
  uploadState: FileUploadState;
  currentStep: WorkflowStep;
  isProcessing: boolean;
  onParseFiles: () => void;
  onMapFields: () => void;
  onGenerateDocument: () => void;
  canParse: boolean;
  canMap: boolean;
  canGenerate: boolean;
}

export function StatusPanel({
  uploadState,
  currentStep,
  isProcessing,
  onParseFiles,
  onMapFields,
  onGenerateDocument,
  canParse,
  canMap,
  canGenerate,
}: StatusPanelProps) {
  
  const getStatusIcon = (condition: boolean, pending: boolean = false) => {
    if (pending) return <Clock className="h-4 w-4" />;
    return condition ? 
      <CheckCircle className="h-4 w-4 text-chart-2" /> : 
      <XCircle className="h-4 w-4 text-destructive" />;
  };

  const getStatusText = (condition: boolean, pending: boolean = false) => {
    if (pending) return 'Pending';
    return condition ? 'Complete' : 'Not uploaded';
  };

  const getStatusColor = (condition: boolean, pending: boolean = false) => {
    if (pending) return 'text-muted-foreground';
    return condition ? 'text-chart-2' : 'text-destructive';
  };

  return (
    <div className="space-y-6">
      {/* Processing Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Play className="h-4 w-4" />
            Actions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            onClick={onParseFiles}
            disabled={!canParse || isProcessing}
            className="w-full"
            data-testid="button-parse-files"
          >
            <Play className="mr-2 h-4 w-4" />
            {isProcessing ? 'Processing...' : 'Parse Files'}
          </Button>
          
          <Button
            onClick={onMapFields}
            disabled={!canMap || isProcessing}
            variant="secondary"
            className="w-full"
            data-testid="button-map-fields"
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Map Fields
          </Button>
          
          <Button
            onClick={onGenerateDocument}
            disabled={!canGenerate || isProcessing}
            variant="outline"
            className="w-full"
            data-testid="button-generate-document"
          >
            <FileText className="mr-2 h-4 w-4" />
            Generate Document
          </Button>
        </CardContent>
      </Card>

      {/* Status Panel */}
      <Card>
        <CardHeader>
          <CardTitle>Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">JSON Template</span>
            <div className={`flex items-center gap-1 ${getStatusColor(!!uploadState.jsonFile)}`}>
              {getStatusIcon(!!uploadState.jsonFile)}
              <span data-testid="status-json">{getStatusText(!!uploadState.jsonFile)}</span>
            </div>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Excel Document</span>
            <div className={`flex items-center gap-1 ${getStatusColor(!!uploadState.excelFile)}`}>
              {getStatusIcon(!!uploadState.excelFile)}
              <span data-testid="status-excel">{getStatusText(!!uploadState.excelFile)}</span>
            </div>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Field Mapping</span>
            <div className={`flex items-center gap-1 ${getStatusColor(currentStep !== 'upload', currentStep === 'parse')}`}>
              {getStatusIcon(currentStep !== 'upload', currentStep === 'parse')}
              <span data-testid="status-mapping">{getStatusText(currentStep !== 'upload', currentStep === 'parse')}</span>
            </div>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Document Ready</span>
            <div className={`flex items-center gap-1 ${getStatusColor(currentStep === 'generate', currentStep === 'review')}`}>
              {getStatusIcon(currentStep === 'generate', currentStep === 'review')}
              <span data-testid="status-document">{getStatusText(currentStep === 'generate', currentStep === 'review')}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Options
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="use-llm" className="text-sm font-medium">
              Use LLM Enhancement
            </Label>
            <Switch
              id="use-llm"
              checked={uploadState.useLLM}
              onCheckedChange={(checked) => {
                // Would be handled by parent component
              }}
              data-testid="switch-use-llm"
            />
          </div>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="preview-mode" className="text-sm font-medium">
              Include Preview Mode
            </Label>
            <Switch
              id="preview-mode"
              defaultChecked={true}
              data-testid="switch-preview-mode"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="confidence-threshold" className="text-sm font-medium">
              Confidence Threshold
            </Label>
            <Select defaultValue="medium">
              <SelectTrigger data-testid="select-confidence-threshold">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="high">High (90%+)</SelectItem>
                <SelectItem value="medium">Medium (70%+)</SelectItem>
                <SelectItem value="low">Low (50%+)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
