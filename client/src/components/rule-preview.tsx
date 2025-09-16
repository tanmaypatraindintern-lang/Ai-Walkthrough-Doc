import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Languages, Edit2, Check, X } from 'lucide-react';
import { RuleTransformation } from '@/types';
import { getConfidenceLevel } from '@/utils/mapping';

interface RulePreviewProps {
  rules: RuleTransformation[];
  onUpdateRule: (id: string, updates: { isAccepted?: number; transformedRule?: string }) => void;
  isLoading?: boolean;
}

export function RulePreview({ rules, onUpdateRule, isLoading = false }: RulePreviewProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const handleEdit = (rule: RuleTransformation) => {
    setEditingId(rule.id || '');
    setEditValue(rule.transformed);
  };

  const handleSaveEdit = (id: string) => {
    onUpdateRule(id, { transformedRule: editValue });
    setEditingId(null);
    setEditValue('');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditValue('');
  };

  const handleAccept = (id: string) => {
    onUpdateRule(id, { isAccepted: 1 });
  };

  const handleReject = (id: string) => {
    onUpdateRule(id, { isAccepted: -1 });
  };

  if (rules.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Rule Transformations
            <span className="text-sm text-muted-foreground font-normal">Plain English preview</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <Languages className="mx-auto h-12 w-12 mb-3" />
            <p className="text-lg mb-1">Upload files to see rule translations</p>
            <p className="text-sm">Technical rules will be converted to plain English</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Transformed Rules</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {rules.map((rule) => {
          const isEditing = editingId === rule.id;
          const confidence = getConfidenceLevel(rule.confidence);
          
          return (
            <div key={rule.id} className="border border-border rounded-lg p-4" data-testid={`rule-${rule.id}`}>
              <div className="mb-2">
                <Badge variant="outline" className="font-mono text-xs">
                  {rule.original}
                </Badge>
              </div>
              
              {isEditing ? (
                <Textarea
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  className="w-full mb-3"
                  rows={3}
                  data-testid={`textarea-edit-${rule.id}`}
                />
              ) : (
                <p className="text-sm text-card-foreground mb-3">{rule.transformed}</p>
              )}
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className={`text-xs ${confidence.color}`}>
                    Confidence: {Math.round(rule.confidence * 100)}%
                  </span>
                  {rule.isAccepted === 1 && (
                    <Badge variant="outline" className="text-chart-2 border-chart-2">
                      Accepted
                    </Badge>
                  )}
                  {rule.isAccepted === -1 && (
                    <Badge variant="outline" className="text-destructive border-destructive">
                      Rejected
                    </Badge>
                  )}
                </div>
                
                <div className="flex items-center space-x-2">
                  {isEditing ? (
                    <>
                      <Button
                        size="sm"
                        onClick={() => handleSaveEdit(rule.id!)}
                        disabled={isLoading}
                        data-testid={`button-save-rule-${rule.id}`}
                      >
                        <Check className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleCancelEdit}
                        disabled={isLoading}
                        data-testid={`button-cancel-rule-${rule.id}`}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </>
                  ) : (
                    <>
                      {rule.isAccepted !== 1 && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-chart-2 hover:text-chart-2/80"
                          onClick={() => handleAccept(rule.id!)}
                          disabled={isLoading}
                          data-testid={`button-accept-rule-${rule.id}`}
                        >
                          Accept
                        </Button>
                      )}
                      {rule.isAccepted !== -1 && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive hover:text-destructive/80"
                          onClick={() => handleReject(rule.id!)}
                          disabled={isLoading}
                          data-testid={`button-reject-rule-${rule.id}`}
                        >
                          Reject
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-primary hover:text-primary/80"
                        onClick={() => handleEdit(rule)}
                        disabled={isLoading}
                        data-testid={`button-edit-rule-${rule.id}`}
                      >
                        <Edit2 className="mr-1 h-3 w-3" />
                        Edit
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
