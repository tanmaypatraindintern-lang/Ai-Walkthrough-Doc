import { FieldMapping, ConfidenceLevel } from '@/types';

export function getConfidenceLevel(confidence: number): ConfidenceLevel {
  if (confidence >= 0.9) {
    return { level: 'high', color: 'text-chart-2', threshold: 0.9 };
  } else if (confidence >= 0.7) {
    return { level: 'medium', color: 'text-chart-3', threshold: 0.7 };
  } else {
    return { level: 'low', color: 'text-destructive', threshold: 0.5 };
  }
}

export function getConfidenceBadge(confidence: number): string {
  const level = getConfidenceLevel(confidence);
  const baseClasses = 'text-xs px-2 py-1 rounded-full font-medium';
  
  switch (level.level) {
    case 'high':
      return `${baseClasses} bg-chart-2/10 text-chart-2`;
    case 'medium':
      return `${baseClasses} bg-chart-3/10 text-chart-3`;
    case 'low':
      return `${baseClasses} bg-destructive/10 text-destructive`;
    default:
      return `${baseClasses} bg-muted text-muted-foreground`;
  }
}

export function calculateOverallConfidence(mappings: FieldMapping[]): number {
  if (mappings.length === 0) return 0;
  const sum = mappings.reduce((acc, mapping) => acc + mapping.confidence, 0);
  return sum / mappings.length;
}

export function groupMappingsByConfidence(mappings: FieldMapping[]): Record<string, FieldMapping[]> {
  return mappings.reduce((groups, mapping) => {
    const level = getConfidenceLevel(mapping.confidence).level;
    if (!groups[level]) groups[level] = [];
    groups[level].push(mapping);
    return groups;
  }, {} as Record<string, FieldMapping[]>);
}
