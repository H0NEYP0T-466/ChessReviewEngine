/**
 * Main chess board component with navigation and analysis display.
 */

import { useState, useEffect } from 'react';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';
import { EvalBar } from './EvalBar';
import { ClassificationBadge } from './ClassificationBadge';
import type { MoveAnalysis, MoveArrow } from '../types/analysis';

interface AnalysisBoardProps {
  moves: MoveAnalysis[];
  currentMoveIndex: number;
  onMoveIndexChange: (index: number) => void;
}

export function AnalysisBoard({
  moves,
  currentMoveIndex,
  onMoveIndexChange,
}: AnalysisBoardProps) {
  const [game] = useState(new Chess());
  const [position, setPosition] = useState(game.fen());
  const [arrows, setArrows] = useState<Array<[string, string]>>([]);

  // Update board position when move index changes
  useEffect(() => {
    game.reset();
    
    if (currentMoveIndex >= 0 && currentMoveIndex < moves.length) {
      // Play all moves up to current index
      for (let i = 0; i <= currentMoveIndex; i++) {
        const move = moves[i];
        try {
          game.move(move.uci);
        } catch (error) {
          console.error('Failed to play move:', move.uci, error);
        }
      }
      
      setPosition(game.fen());
      
      // Set arrows for mistakes/blunders
      const currentMove = moves[currentMoveIndex];
      if (currentMove.arrows && currentMove.arrows.length > 0) {
        const arrowPairs = currentMove.arrows.map(
          (arrow: MoveArrow) => [arrow.from, arrow.to] as [string, string]
        );
        setArrows(arrowPairs);
      } else {
        setArrows([]);
      }
    } else {
      setPosition(game.fen());
      setArrows([]);
    }
  }, [currentMoveIndex, moves, game]);

  const currentMove = currentMoveIndex >= 0 ? moves[currentMoveIndex] : null;

  const handlePrevious = () => {
    if (currentMoveIndex > 0) {
      onMoveIndexChange(currentMoveIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentMoveIndex < moves.length - 1) {
      onMoveIndexChange(currentMoveIndex + 1);
    }
  };

  const handleFirst = () => {
    onMoveIndexChange(0);
  };

  const handleLast = () => {
    onMoveIndexChange(moves.length - 1);
  };

  return (
    <div className="space-y-4">
      {/* Board and Eval Bar */}
      <div className="flex gap-4 items-center justify-center">
        <EvalBar 
          evalCp={currentMove?.engine.played_eval_cp ?? 0} 
          height="600px"
        />
        
        <div className="w-full max-w-2xl">
          <Chessboard
            position={position}
            boardWidth={600}
            customArrows={arrows}
            customArrowColor="rgb(239, 68, 68)"
            arePiecesDraggable={false}
          />
        </div>
      </div>

      {/* Move Info */}
      {currentMove && (
        <div className="bg-dark-surface rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl font-mono font-bold">
                {Math.floor(currentMove.index / 2) + 1}.
                {currentMove.side === 'black' ? '..' : ''} {currentMove.san}
              </span>
              <ClassificationBadge classification={currentMove.classification} size="lg" />
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-400">Move Accuracy</div>
              <div className="text-2xl font-bold text-green-400">
                {currentMove.accuracy.toFixed(1)}%
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-400">Evaluation:</span>
              <span className="ml-2 font-mono">
                {currentMove.engine.played_eval_cp > 0 ? '+' : ''}
                {(currentMove.engine.played_eval_cp / 100).toFixed(2)}
              </span>
            </div>
            <div>
              <span className="text-gray-400">Best Move:</span>
              <span className="ml-2 font-mono">{currentMove.engine.best_move}</span>
            </div>
            <div>
              <span className="text-gray-400">Win Probability:</span>
              <span className="ml-2">
                {(currentMove.engine.win_probability * 100).toFixed(1)}%
              </span>
            </div>
            <div>
              <span className="text-gray-400">CP Loss:</span>
              <span className="ml-2">{currentMove.engine.eval_diff_cp}</span>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Controls */}
      <div className="flex justify-center gap-2">
        <button
          onClick={handleFirst}
          disabled={currentMoveIndex <= 0}
          className="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 
                   disabled:cursor-not-allowed rounded-lg transition-colors"
        >
          ⏮ First
        </button>
        <button
          onClick={handlePrevious}
          disabled={currentMoveIndex <= 0}
          className="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 
                   disabled:cursor-not-allowed rounded-lg transition-colors"
        >
          ◀ Previous
        </button>
        <button
          onClick={handleNext}
          disabled={currentMoveIndex >= moves.length - 1}
          className="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 
                   disabled:cursor-not-allowed rounded-lg transition-colors"
        >
          Next ▶
        </button>
        <button
          onClick={handleLast}
          disabled={currentMoveIndex >= moves.length - 1}
          className="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 
                   disabled:cursor-not-allowed rounded-lg transition-colors"
        >
          Last ⏭
        </button>
      </div>

      {/* Move counter */}
      <div className="text-center text-sm text-gray-400">
        Move {currentMoveIndex + 1} of {moves.length}
      </div>
    </div>
  );
}
