import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { X, Upload, FileCode, FileSpreadsheet, CheckCircle, XCircle } from 'lucide-react';
import { validateJsonFile, validateExcelFile, formatFileSize, getFileIcon } from '@/utils/file-parser';
import { FileUploadState } from '@/types';

interface FileUploadProps {
  value: FileUploadState;
  onChange: (state: FileUploadState) => void;
  onValidationChange: (isValid: boolean) => void;
}

export function FileUpload({ value, onChange, onValidationChange }: FileUploadProps) {
  const [dragStates, setDragStates] = useState({ json: false, excel: false });
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const updateValidation = useCallback((newState: FileUploadState, errors: Record<string, string> = {}) => {
    const isValid = !!(newState.jsonFile && newState.excelFile && newState.name.length > 0 && Object.keys(errors).length === 0);
    onValidationChange(isValid);
    setValidationErrors(errors);
  }, [onValidationChange]);

  const handleFileChange = useCallback(async (type: 'json' | 'excel', files: File[]) => {
    if (files.length === 0) return;
    
    const file = files[0];
    const newState = { ...value };
    const errors = { ...validationErrors };

    if (type === 'json') {
      try {
        await validateJsonFile(file);
        newState.jsonFile = file;
        delete errors.json;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Invalid JSON file';
        errors.json = errorMessage;
        newState.jsonFile = null;
      }
    } else {
      if (validateExcelFile(file)) {
        newState.excelFile = file;
        delete errors.excel;
      } else {
        errors.excel = 'Invalid Excel file format';
        newState.excelFile = null;
      }
    }

    onChange(newState);
    updateValidation(newState, errors);
  }, [value, onChange, validationErrors, updateValidation]);

  const removeFile = useCallback((type: 'json' | 'excel') => {
    const newState = { ...value };
    if (type === 'json') {
      newState.jsonFile = null;
    } else {
      newState.excelFile = null;
    }
    onChange(newState);
    updateValidation(newState, validationErrors);
  }, [value, onChange, validationErrors, updateValidation]);

  const jsonDropzone = useDropzone({
    onDrop: (files) => handleFileChange('json', files),
    accept: { 'application/json': ['.json'] },
    multiple: false,
    onDragEnter: () => setDragStates(prev => ({ ...prev, json: true })),
    onDragLeave: () => setDragStates(prev => ({ ...prev, json: false })),
  });

  const excelDropzone = useDropzone({
    onDrop: (files) => handleFileChange('excel', files),
    accept: { 
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls']
    },
    multiple: false,
    onDragEnter: () => setDragStates(prev => ({ ...prev, excel: true })),
    onDragLeave: () => setDragStates(prev => ({ ...prev, excel: false })),
  });

  return (
    <div className="space-y-6">
      {/* Document Name Input */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-2">
            <Label htmlFor="document-name" className="text-sm font-medium">
              Document Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="document-name"
              placeholder="Enter document name..."
              value={value.name}
              onChange={(e) => {
                const newState = { ...value, name: e.target.value };
                onChange(newState);
                updateValidation(newState, validationErrors);
              }}
              data-testid="input-document-name"
            />
          </div>
        </CardContent>
      </Card>

      {/* JSON Template Upload */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
              <FileCode className="text-accent-foreground h-4 w-4" />
            </div>
            <h3 className="text-lg font-medium text-card-foreground">JSON Template</h3>
            <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">Required</span>
          </div>
          
          {!value.jsonFile ? (
            <div
              {...jsonDropzone.getRootProps()}
              className={`upload-area rounded-lg p-8 text-center cursor-pointer transition-all ${
                dragStates.json ? 'drag-over' : ''
              }`}
              data-testid="dropzone-json"
            >
              <input {...jsonDropzone.getInputProps()} data-testid="input-json-file" />
              <div className="mb-4">
                <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-3" />
                <p className="text-foreground font-medium mb-1">Drop your JSON template here</p>
                <p className="text-sm text-muted-foreground">or click to browse files</p>
              </div>
              <Button 
                type="button" 
                className="bg-primary text-primary-foreground hover:bg-primary/90"
                data-testid="button-browse-json"
              >
                Browse Files
              </Button>
            </div>
          ) : (
            <div className="p-4 bg-muted rounded-lg" data-testid="preview-json">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <FileCode className="text-primary h-4 w-4" />
                  <span className="text-sm font-medium">{value.jsonFile.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatFileSize(value.jsonFile.size)}
                  </span>
                  <CheckCircle className="h-4 w-4 text-chart-2" />
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile('json')}
                  className="text-destructive hover:text-destructive/80"
                  data-testid="button-remove-json"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
          
          {validationErrors.json && (
            <div className="mt-2 flex items-center space-x-2 text-destructive text-sm">
              <XCircle className="h-4 w-4" />
              <span>{validationErrors.json}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Excel Document Upload */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-8 h-8 bg-chart-2/10 rounded-lg flex items-center justify-center">
              <FileSpreadsheet className="text-chart-2 h-4 w-4" />
            </div>
            <h3 className="text-lg font-medium text-card-foreground">Excel Document</h3>
            <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">Required</span>
          </div>
          
          {!value.excelFile ? (
            <div
              {...excelDropzone.getRootProps()}
              className={`upload-area rounded-lg p-8 text-center cursor-pointer transition-all ${
                dragStates.excel ? 'drag-over' : ''
              }`}
              data-testid="dropzone-excel"
            >
              <input {...excelDropzone.getInputProps()} data-testid="input-excel-file" />
              <div className="mb-4">
                <FileSpreadsheet className="mx-auto h-8 w-8 text-muted-foreground mb-3" />
                <p className="text-foreground font-medium mb-1">Drop your Excel file here</p>
                <p className="text-sm text-muted-foreground">Supports .xlsx and .xls formats</p>
              </div>
              <Button 
                type="button" 
                className="bg-primary text-primary-foreground hover:bg-primary/90"
                data-testid="button-browse-excel"
              >
                Browse Files
              </Button>
            </div>
          ) : (
            <div className="p-4 bg-muted rounded-lg" data-testid="preview-excel">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <FileSpreadsheet className="text-chart-2 h-4 w-4" />
                  <span className="text-sm font-medium">{value.excelFile.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatFileSize(value.excelFile.size)}
                  </span>
                  <CheckCircle className="h-4 w-4 text-chart-2" />
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile('excel')}
                  className="text-destructive hover:text-destructive/80"
                  data-testid="button-remove-excel"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
          
          {validationErrors.excel && (
            <div className="mt-2 flex items-center space-x-2 text-destructive text-sm">
              <XCircle className="h-4 w-4" />
              <span>{validationErrors.excel}</span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
