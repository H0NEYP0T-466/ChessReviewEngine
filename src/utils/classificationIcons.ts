/**
 * Utility for mapping move classifications to icons and colors.
 * Used for overlay visualization on the chessboard.
 */

import type { MoveClassification } from '../types/analysis';

// Import classification images
import theoryImg from '../assets/thoery.png';
import bestImg from '../assets/best.png';
import excellentImg from '../assets/excellent.png';
import greatImg from '../assets/great.png';
import goodImg from '../assets/good.png';
import brilliantImg from '../assets/brillant.png';
import inaccuracyImg from '../assets/inaccuracy.png';
import mistakeImg from '../assets/mistake.png';
import blunderImg from '../assets/blunder.png';

export interface ClassificationStyle {
  icon: string;
  imageUrl: string;
  color: string;
  backgroundColor: string;
}

/**
 * Maps each move classification to its corresponding icon and styling.
 * Icons are now PNG images imported from assets folder.
 */
export const classificationStyles: Record<MoveClassification, ClassificationStyle> = {
  theory: {
    icon: '📖',
    imageUrl: theoryImg,
    color: '#9ca3af', // gray-400
    backgroundColor: '#374151', // gray-700
  },
  good: {
    icon: '✓',
    imageUrl: goodImg,
    color: '#ffffff',
    backgroundColor: '#3b82f6', // blue-500
  },
  great: {
    icon: '✓✓',
    imageUrl: greatImg,
    color: '#ffffff',
    backgroundColor: '#84cc16', // lime-500
  },
  best: {
    icon: '⭐',
    imageUrl: bestImg,
    color: '#ffffff',
    backgroundColor: '#16a34a', // green-600
  },
  excellent: {
    icon: '⚡',
    imageUrl: excellentImg,
    color: '#ffffff',
    backgroundColor: '#22c55e', // green-500
  },
  brilliant: {
    icon: '‼',
    imageUrl: brilliantImg,
    color: '#ffffff',
    backgroundColor: '#9333ea', // purple-600
  },
  inaccuracy: {
    icon: '?!',
    imageUrl: inaccuracyImg,
    color: '#ffffff',
    backgroundColor: '#ea580c', // orange-600
  },
  mistake: {
    icon: '?',
    imageUrl: mistakeImg,
    color: '#ffffff',
    backgroundColor: '#f97316', // orange-500
  },
  blunder: {
    icon: '??',
    imageUrl: blunderImg,
    color: '#ffffff',
    backgroundColor: '#dc2626', // red-600
  },
};

/**
 * Get the style for a given move classification.
 */
export function getClassificationStyle(classification: MoveClassification): ClassificationStyle {
  return classificationStyles[classification];
}
