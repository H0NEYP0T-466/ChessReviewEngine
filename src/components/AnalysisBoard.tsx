/**
 * Main chess board component with navigation and analysis display.
 */

import { useState, useEffect, useCallback } from 'react';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';
import { EvalBar } from './EvalBar';
import { ClassificationBadge } from './ClassificationBadge';
import { MoveClassificationOverlay } from './MoveClassificationOverlay';
import type { MoveAnalysis, MoveArrow } from '../types/analysis';

interface AnalysisBoardProps {
  moves: MoveAnalysis[];
  currentMoveIndex: number;
  onMoveIndexChange: (index: number) => void;
}

type Arrow = {
  startSquare: string;
  endSquare: string;
  color: string;
};

export function AnalysisBoard({
  moves,
  currentMoveIndex,
  onMoveIndexChange,
}: AnalysisBoardProps) {
  const [game] = useState(new Chess());
  const [position, setPosition] = useState(game.fen());
  const [arrows, setArrows] = useState<Arrow[]>([]);

  // Update board position when move index changes
  useEffect(() => {
    const updatePosition = () => {
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
        
        const newPosition = game.fen();
        setPosition(newPosition);
        
        // Set arrows for mistakes/blunders/inaccuracies
        const currentMove = moves[currentMoveIndex];
        if (currentMove.arrows && currentMove.arrows.length > 0) {
          const arrowList: Arrow[] = currentMove.arrows.map(
            (arrow: MoveArrow) => ({
              startSquare: arrow.from,
              endSquare: arrow.to,
              color: 'rgb(239, 68, 68)'
            })
          );
          setArrows(arrowList);
        } else {
          setArrows([]);
        }
      } else {
        setPosition(game.fen());
        setArrows([]);
      }
    };
    
    updatePosition();
  }, [currentMoveIndex, moves, game]);

  const currentMove = currentMoveIndex >= 0 ? moves[currentMoveIndex] : null;

  // Extract destination square from UCI notation (e.g., "e2e4" -> "e4")
  const getDestinationSquare = (uci: string): string => {
    if (uci.length >= 4) {
      return uci.substring(2, 4);
    }
    return '';
  };

  const handlePrevious = useCallback(() => {
    if (currentMoveIndex > 0) {
      onMoveIndexChange(currentMoveIndex - 1);
    }
  }, [currentMoveIndex, onMoveIndexChange]);

  const handleNext = useCallback(() => {
    if (currentMoveIndex < moves.length - 1) {
      onMoveIndexChange(currentMoveIndex + 1);
    }
  }, [currentMoveIndex, moves.length, onMoveIndexChange]);

  const handleFirst = () => {
    onMoveIndexChange(0);
  };

  const handleLast = () => {
    onMoveIndexChange(moves.length - 1);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'ArrowLeft':
          handlePrevious();
          break;
        case 'ArrowRight':
          handleNext();
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handlePrevious, handleNext]);

  return (
    <div className="space-y-4">
      {/* Board and Eval Bar */}
      <div className="flex gap-4 items-start">
        <EvalBar 
          evalCp={currentMove?.engine.played_eval_cp ?? 0} 
          height="500px"
        />
        
        <div className="flex-1 max-w-[500px] relative">
          <Chessboard
            options={{
              id: 'analysis-board',
              position: position,
              arrows: arrows,
              allowDragging: false,
            }}
          />
          {/* Classification overlay on destination square */}
          {currentMove && (
            <MoveClassificationOverlay
              classification={currentMove.classification}
              targetSquare={getDestinationSquare(currentMove.uci)}
              boardOrientation="white"
            />
          )}
        </div>
      </div>

      {/* Move Info */}
      {currentMove && (
        <div className="bg-zinc-800 rounded-lg p-4 space-y-3">
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

          {/* Show top engine move if current move is not best */}
          {currentMove.engine.eval_diff_cp > 10 && currentMove.engine.best_move && (
            <div className="mt-3 pt-3 border-t border-gray-700">
              <div className="text-sm">
                <span className="text-gray-400">Top Engine Move:</span>
                <span className="ml-2 font-mono font-semibold text-green-400">
                  {currentMove.engine.best_move}
                </span>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Best evaluation: {currentMove.engine.best_eval_cp > 0 ? '+' : ''}
                {(currentMove.engine.best_eval_cp / 100).toFixed(2)}
              </div>
            </div>
          )}
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
