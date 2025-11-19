/**
 * Evaluation bar component showing position evaluation.
 * The evaluation is always from White's perspective:
 * - Positive values = White is winning (more white at top)
 * - Negative values = Black is winning (more black at bottom)
 */

interface EvalBarProps {
  evalCp: number;
  height?: string;
}

export function EvalBar({ evalCp, height = '400px' }: EvalBarProps) {
  // Clamp evaluation between -1000 and 1000
  const clampedEval = Math.max(-1000, Math.min(1000, evalCp));
  
  // Convert to percentage (0% = black winning, 100% = white winning)
  // The evaluation is ALWAYS from White's perspective, regardless of whose turn it is
  const whitePercent = ((clampedEval + 1000) / 2000) * 100;

  return (
    <div className="flex flex-col w-8 rounded overflow-hidden" style={{ height }}>
      {/* White advantage (top) */}
      <div
        className="bg-gray-200 transition-all duration-300 ease-out flex items-end justify-center"
        style={{ height: `${whitePercent}%` }}
      >
        {whitePercent > 15 && (
          <span className="text-xs font-bold text-gray-800 mb-1">
            {evalCp > 0 ? `+${(evalCp / 100).toFixed(1)}` : ''}
          </span>
        )}
      </div>
      
      {/* Black advantage (bottom) */}
      <div
        className="bg-gray-800 transition-all duration-300 ease-out flex items-start justify-center"
        style={{ height: `${100 - whitePercent}%` }}
      >
        {whitePercent < 85 && (
          <span className="text-xs font-bold text-gray-200 mt-1">
            {evalCp < 0 ? (evalCp / 100).toFixed(1) : ''}
          </span>
        )}
      </div>
    </div>
  );
}
