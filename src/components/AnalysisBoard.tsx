import { useState, useEffect, useCallback } from 'react';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';
import { toast } from 'react-hot-toast';
import { EvalBar } from './EvalBar';
import { ClassificationBadge } from './ClassificationBadge';
import { MoveClassificationOverlay } from './MoveClassificationOverlay';
import { createBrilliantMoveImage, downloadCanvas } from '../utils/brilliantMoveImageGenerator';
import type { MoveAnalysis, MoveArrow } from '../types/analysis';

interface AnalysisBoardProps {
  moves: MoveAnalysis[];
  currentMoveIndex: number;
  onMoveIndexChange: (index: number) => void;
  whitePlayer?: string;
  blackPlayer?: string;
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
  whitePlayer = 'Player',
  blackPlayer = 'Player',
}: AnalysisBoardProps) {
  const [game] = useState(new Chess());
  const [position, setPosition] = useState(game.fen());
  const [arrows, setArrows] = useState<Arrow[]>([]);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);

  useEffect(() => {
    const updatePosition = () => {
      game.reset();
      
      if (currentMoveIndex >= 0 && currentMoveIndex < moves.length) {
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
        
        const currentMove = moves[currentMoveIndex];
        if (currentMove.arrows && currentMove.arrows.length > 0) {
          const arrowColor = currentMove.classification === 'best' || currentMove.classification === 'excellent'
            ? 'rgba(129, 182, 76, 0.8)'
            : currentMove.classification === 'great' || currentMove.classification === 'good'
            ? 'rgba(92, 139, 176, 0.8)'
            : 'rgba(202, 52, 49, 0.8)';
          
          const arrowList: Arrow[] = currentMove.arrows.map(
            (arrow: MoveArrow) => ({
              startSquare: arrow.from,
              endSquare: arrow.to,
              color: arrowColor
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

  const handleDownloadBrilliantMove = async () => {
    if (!currentMove || currentMove.classification !== 'brilliant') {
      return;
    }

    setIsGeneratingImage(true);
    try {
      const playerName = currentMove.side === 'white' ? whitePlayer : blackPlayer;
      const canvas = await createBrilliantMoveImage({
        fen: position,
        username: playerName,
        moveNotation: currentMove.san,
        playerSide: currentMove.side,
      });
      
      const filename = `brilliant_move_${playerName.replace(/\s+/g, '_')}_${currentMove.san}.png`;
      downloadCanvas(canvas, filename);
      toast.success('Brilliant move image downloaded!');
    } catch (error) {
      console.error('Failed to generate brilliant move image:', error);
      toast.error('Failed to generate image');
    } finally {
      setIsGeneratingImage(false);
    }
  };

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
          {currentMove && (
            <MoveClassificationOverlay
              classification={currentMove.classification}
              targetSquare={getDestinationSquare(currentMove.uci)}
              boardOrientation="white"
            />
          )}
        </div>
      </div>

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

          {currentMove.classification === 'brilliant' && (
            <div className="mt-3 pt-3 border-t border-gray-700">
              <button
                onClick={handleDownloadBrilliantMove}
                disabled={isGeneratingImage}
                className="w-full px-4 py-3 bg-[#00BFAE] hover:bg-[#00A89C] 
                         disabled:bg-gray-600 disabled:cursor-not-allowed
                         text-white font-semibold rounded-lg transition-colors
                         flex items-center justify-center gap-2"
              >
                {isGeneratingImage ? (
                  <>
                    <span className="animate-spin">⏳</span>
                    Generating Image...
                  </>
                ) : (
                  <>
                    <span>📥</span>
                    Download Brilliant Move Image
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}

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

      <div className="text-center text-sm text-gray-400">
        Move {currentMoveIndex + 1} of {moves.length}
      </div>
    </div>
  );
}
