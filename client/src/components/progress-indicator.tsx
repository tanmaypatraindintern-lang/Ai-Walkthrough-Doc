import { WorkflowStep } from '@/types';

interface ProgressIndicatorProps {
  currentStep: WorkflowStep;
  className?: string;
}

const steps: { key: WorkflowStep; label: string; order: number }[] = [
  { key: 'upload', label: 'Upload Files', order: 1 },
  { key: 'parse', label: 'Parse & Map', order: 2 },
  { key: 'review', label: 'Review & Edit', order: 3 },
  { key: 'generate', label: 'Generate Doc', order: 4 },
];

export function ProgressIndicator({ currentStep, className = '' }: ProgressIndicatorProps) {
  const currentOrder = steps.find(s => s.key === currentStep)?.order || 1;
  const progress = (currentOrder / steps.length) * 100;

  return (
    <div className={`mb-8 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-medium text-foreground">Document Generation Workflow</h2>
        <span className="text-sm text-muted-foreground">Step {currentOrder} of {steps.length}</span>
      </div>
      
      <div 
        className="step-indicator" 
        style={{ '--progress': `${progress}%` } as React.CSSProperties}
      />
      
      <div className="flex justify-between mt-2 text-xs text-muted-foreground">
        {steps.map((step) => (
          <span 
            key={step.key}
            className={step.order <= currentOrder ? 'text-primary font-medium' : ''}
            data-testid={`step-${step.key}`}
          >
            {step.label}
          </span>
        ))}
      </div>
    </div>
  );
}
