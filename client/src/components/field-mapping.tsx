import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Check, X, Edit2, Search, ArrowUpDown } from 'lucide-react';
import { FieldMapping } from '@/types';
import { getConfidenceLevel, getConfidenceBadge } from '@/utils/mapping';

interface FieldMappingProps {
  mappings: FieldMapping[];
  onUpdateMapping: (id: string, updates: { isAccepted?: number; excelColumn?: string }) => void;
  isLoading?: boolean;
}

export function FieldMappingTable({ mappings, onUpdateMapping, isLoading = false }: FieldMappingProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const handleEdit = (mapping: FieldMapping) => {
    setEditingId(mapping.id || '');
    setEditValue(mapping.excelColumn);
  };

  const handleSaveEdit = (id: string) => {
    onUpdateMapping(id, { excelColumn: editValue });
    setEditingId(null);
    setEditValue('');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditValue('');
  };

  const handleAccept = (id: string) => {
    onUpdateMapping(id, { isAccepted: 1 });
  };

  const handleReject = (id: string) => {
    onUpdateMapping(id, { isAccepted: -1 });
  };

  if (mappings.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Field Mapping Preview
            <span className="text-sm text-muted-foreground font-normal">Auto-generated mappings</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <ArrowUpDown className="mx-auto h-12 w-12 mb-3" />
            <p className="text-lg mb-1">Upload files to see field mappings</p>
            <p className="text-sm">We'll automatically match JSON fields to Excel columns</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Field Mapping Results</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-1/4">JSON Field</TableHead>
                <TableHead className="w-1/4">Excel Column</TableHead>
                <TableHead className="w-1/6">Confidence</TableHead>
                <TableHead className="w-1/3">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mappings.map((mapping) => {
                const isEditing = editingId === mapping.id;
                const confidence = getConfidenceLevel(mapping.confidence);
                
                return (
                  <TableRow key={mapping.id} data-testid={`mapping-row-${mapping.id}`}>
                    <TableCell className="font-mono text-sm">{mapping.jsonField}</TableCell>
                    <TableCell>
                      {isEditing ? (
                        <Input
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="w-full"
                          data-testid={`input-edit-${mapping.id}`}
                        />
                      ) : (
                        mapping.excelColumn
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <span className={`font-medium ${confidence.color}`}>
                          {Math.round(mapping.confidence * 100)}%
                        </span>
                        <span className={getConfidenceBadge(mapping.confidence)}>
                          {confidence.level}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {isEditing ? (
                          <>
                            <Button
                              size="sm"
                              onClick={() => handleSaveEdit(mapping.id!)}
                              disabled={isLoading}
                              data-testid={`button-save-${mapping.id}`}
                            >
                              <Check className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={handleCancelEdit}
                              disabled={isLoading}
                              data-testid={`button-cancel-${mapping.id}`}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </>
                        ) : (
                          <>
                            {mapping.isAccepted !== 1 && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-chart-2 hover:text-chart-2/80"
                                onClick={() => handleAccept(mapping.id!)}
                                disabled={isLoading}
                                data-testid={`button-accept-${mapping.id}`}
                              >
                                <Check className="mr-1 h-3 w-3" />
                                Accept
                              </Button>
                            )}
                            {mapping.isAccepted !== -1 && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-destructive hover:text-destructive/80"
                                onClick={() => handleReject(mapping.id!)}
                                disabled={isLoading}
                                data-testid={`button-reject-${mapping.id}`}
                              >
                                <X className="mr-1 h-3 w-3" />
                                Reject
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-muted-foreground hover:text-foreground"
                              onClick={() => handleEdit(mapping)}
                              disabled={isLoading}
                              data-testid={`button-edit-${mapping.id}`}
                            >
                              <Edit2 className="mr-1 h-3 w-3" />
                              Edit
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
