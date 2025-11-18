/**
 * Component for displaying the list of moves with navigation.
 */

import { ClassificationBadge } from './ClassificationBadge';
import type { MoveAnalysis } from '../types/analysis';

interface MoveListProps {
  moves: MoveAnalysis[];
  currentMoveIndex: number;
  onMoveSelect: (index: number) => void;
}

export function MoveList({ moves, currentMoveIndex, onMoveSelect }: MoveListProps) {
  // Group moves into pairs (white + black)
  const movePairs: Array<{ white?: MoveAnalysis; black?: MoveAnalysis; moveNumber: number }> = [];
  
  for (let i = 0; i < moves.length; i += 2) {
    movePairs.push({
      moveNumber: Math.floor(i / 2) + 1,
      white: moves[i],
      black: moves[i + 1],
    });
  }

  return (
    <div className="bg-dark-surface rounded-lg p-4 max-h-96 overflow-y-auto">
      <h3 className="text-lg font-semibold mb-4 sticky top-0 bg-dark-surface pb-2">
        Moves
      </h3>
      
      <div className="space-y-1">
        {movePairs.map(({ moveNumber, white, black }) => (
          <div key={moveNumber} className="flex items-center gap-2 text-sm">
            {/* Move number */}
            <span className="text-gray-500 w-8 text-right font-mono">
              {moveNumber}.
            </span>

            {/* White's move */}
            {white && (
              <button
                onClick={() => onMoveSelect(white.index)}
                className={`flex-1 flex items-center justify-between px-2 py-1.5 rounded 
                  hover:bg-dark-border transition-colors ${
                    currentMoveIndex === white.index ? 'bg-dark-border ring-2 ring-green-500' : ''
                  }`}
              >
                <span className="font-mono">{white.san}</span>
                <ClassificationBadge classification={white.classification} size="sm" />
              </button>
            )}

            {/* Black's move */}
            {black && (
              <button
                onClick={() => onMoveSelect(black.index)}
                className={`flex-1 flex items-center justify-between px-2 py-1.5 rounded 
                  hover:bg-dark-border transition-colors ${
                    currentMoveIndex === black.index ? 'bg-dark-border ring-2 ring-green-500' : ''
                  }`}
              >
                <span className="font-mono">{black.san}</span>
                <ClassificationBadge classification={black.classification} size="sm" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
