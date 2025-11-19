/**
 * Utility for mapping move classifications to icons and colors.
 * Used for overlay visualization on the chessboard.
 */

import type { MoveClassification } from '../types/analysis';

export interface ClassificationStyle {
  icon: string;
  color: string;
  backgroundColor: string;
}

/**
 * Maps each move classification to its corresponding icon and styling.
 * Icons are Unicode symbols that represent the quality of the move.
 */
export const classificationStyles: Record<MoveClassification, ClassificationStyle> = {
  theory: {
    icon: '📖',
    color: '#9ca3af', // gray-400
    backgroundColor: '#374151', // gray-700
  },
  good: {
    icon: '✓',
    color: '#ffffff',
    backgroundColor: '#3b82f6', // blue-500
  },
  great: {
    icon: '✓✓',
    color: '#ffffff',
    backgroundColor: '#84cc16', // lime-500
  },
  best: {
    icon: '⭐',
    color: '#ffffff',
    backgroundColor: '#16a34a', // green-600
  },
  excellent: {
    icon: '⚡',
    color: '#ffffff',
    backgroundColor: '#22c55e', // green-500
  },
  brilliant: {
    icon: '‼',
    color: '#ffffff',
    backgroundColor: '#9333ea', // purple-600
  },
  mistake: {
    icon: '?',
    color: '#ffffff',
    backgroundColor: '#f97316', // orange-500
  },
  miss: {
    icon: '?!',
    color: '#ffffff',
    backgroundColor: '#ea580c', // orange-600
  },
  blunder: {
    icon: '??',
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
