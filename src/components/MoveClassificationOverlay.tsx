/**
 * Overlay component that displays a classification icon on a chess square.
 * Appears in the top-right corner of the destination square.
 */

import { useMemo } from 'react';
import type { MoveClassification } from '../types/analysis';
import { getClassificationStyle } from '../utils/classificationIcons';

interface MoveClassificationOverlayProps {
  classification: MoveClassification;
  targetSquare: string;
  boardOrientation?: 'white' | 'black';
}

/**
 * Converts a chess square notation (e.g., "e4") to board coordinates.
 * Returns position in percentage for absolute positioning.
 */
function squareToPosition(square: string, orientation: 'white' | 'black' = 'white'): { top: string; left: string } {
  if (square.length !== 2) {
    return { top: '0%', left: '0%' };
  }

  const file = square.charCodeAt(0) - 'a'.charCodeAt(0); // 0-7 (a-h)
  const rank = parseInt(square[1]) - 1; // 0-7 (1-8)

  // Calculate position based on board orientation
  let leftPercent: number;
  let topPercent: number;

  if (orientation === 'white') {
    leftPercent = file * 12.5; // 100% / 8 squares = 12.5% per square
    topPercent = (7 - rank) * 12.5; // Rank 8 is at top (0%), rank 1 at bottom (87.5%)
  } else {
    leftPercent = (7 - file) * 12.5;
    topPercent = rank * 12.5;
  }

  return {
    top: `${topPercent}%`,
    left: `${leftPercent}%`,
  };
}

export function MoveClassificationOverlay({
  classification,
  targetSquare,
  boardOrientation = 'white',
}: MoveClassificationOverlayProps) {
  const style = getClassificationStyle(classification);
  const position = useMemo(
    () => squareToPosition(targetSquare, boardOrientation),
    [targetSquare, boardOrientation]
  );

  return (
    <div
      className="absolute pointer-events-none z-10"
      style={{
        top: position.top,
        left: position.left,
        width: '18%', // 1/8 of board width
        height: '8%', // 1/8 of board height
      }}
    >
      <div
        className="absolute bottom-6 right-0 "
        style={{
          width: '70%',
          height: '70%',
        }}
      >
        <img 
          src={style.imageUrl} 
          alt={classification}
          className="w-full h-full object-contain"
        />
      </div>
    </div>
  );
}
