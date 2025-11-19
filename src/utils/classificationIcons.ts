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
    backgroundColor: '#96af8b', // Desaturated Green (standard)
  },
  great: {
    icon: '✓✓',
    imageUrl: greatImg,
    color: '#ffffff',
    backgroundColor: '#5c8bb0', // Periwinkle Blue (standard)
  },
  best: {
    icon: '⭐',
    imageUrl: bestImg,
    color: '#ffffff',
    backgroundColor: '#81b64c', // Green (standard)
  },
  excellent: {
    icon: '⚡',
    imageUrl: excellentImg,
    color: '#ffffff',
    backgroundColor: '#96bc4b', // Light Green (standard)
  },
  brilliant: {
    icon: '‼',
    imageUrl: brilliantImg,
    color: '#ffffff',
    backgroundColor: '#1baca6', // Teal/Cyan (standard)
  },
  inaccuracy: {
    icon: '?!',
    imageUrl: inaccuracyImg,
    color: '#ffffff',
    backgroundColor: '#f0c15c', // Yellow (standard)
  },
  mistake: {
    icon: '?',
    imageUrl: mistakeImg,
    color: '#ffffff',
    backgroundColor: '#e6912c', // Orange (standard)
  },
  blunder: {
    icon: '??',
    imageUrl: blunderImg,
    color: '#ffffff',
    backgroundColor: '#ca3431', // Red (standard)
  },
};

/**
 * Get the style for a given move classification.
 */
export function getClassificationStyle(classification: MoveClassification): ClassificationStyle {
  return classificationStyles[classification];
}
