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
  theory: 'bg-gray-600 text-gray-100',
  best: 'bg-green-600 text-white',
  excellent: 'bg-green-500 text-white',
  great: 'bg-lime-500 text-white',
  good: 'bg-blue-500 text-white',
  brilliant: 'bg-purple-600 text-white',
  inaccuracy: 'bg-orange-600 text-white',
  mistake: 'bg-orange-500 text-white',
  blunder: 'bg-red-600 text-white',
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
