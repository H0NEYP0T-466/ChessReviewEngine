/**
 * Badge component to display move classification.
 */

import type { MoveClassification } from '../types/analysis';
import { getClassificationStyle } from '../utils/classificationIcons';

interface ClassificationBadgeProps {
  classification: MoveClassification;
  size?: 'sm' | 'md' | 'lg';
}

const classificationColors: Record<MoveClassification, string> = {
  theory: 'text-white',
  best: 'text-white',
  excellent: 'text-white',
  great: 'text-white',
  good: 'text-white',
  brilliant: 'text-white',
  inaccuracy: 'text-white',
  mistake: 'text-white',
  blunder: 'text-white',
};

const classificationLabels: Record<MoveClassification, string> = {
  theory: 'Theory',
  best: 'Best',
  excellent: 'Excellent',
  great: 'Great',
  good: 'Good',
  brilliant: 'Brilliant!!',
  inaccuracy: 'Inaccuracy',
  mistake: 'Mistake',
  blunder: 'Blunder',
};

export function ClassificationBadge({ 
  classification, 
  size = 'md' 
}: ClassificationBadgeProps) {
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-sm px-2.5 py-1 gap-1.5',
    lg: 'text-base px-3 py-1.5 gap-2',
  };

  const imageSizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  const colorClass = classificationColors[classification];
  const sizeClass = sizeClasses[size];
  const imageSizeClass = imageSizeClasses[size];
  const label = classificationLabels[classification];
  const style = getClassificationStyle(classification);

  return (
    <span
      className={`inline-flex items-center font-semibold rounded ${colorClass} ${sizeClass}`}
      style={{ backgroundColor: style.backgroundColor }}
    >
      <img 
        src={style.imageUrl} 
        alt={classification}
        className={`${imageSizeClass} object-contain`}
      />
      {label}
    </span>
  );
}
