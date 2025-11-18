/**
 * Panel displaying player accuracy and statistics.
 */

import type { PlayerSummary } from '../types/analysis';

interface AccuracyPanelProps {
  whiteSummary: PlayerSummary;
  blackSummary: PlayerSummary;
  whitePlayer?: string;
  blackPlayer?: string;
}

export function AccuracyPanel({
  whiteSummary,
  blackSummary,
  whitePlayer = 'White',
  blackPlayer = 'Black',
}: AccuracyPanelProps) {
  return (
    <div className="bg-dark-surface rounded-lg p-4 space-y-4">
      <h3 className="text-lg font-semibold mb-4">Player Accuracy</h3>
      
      {/* White Player */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-medium">{whitePlayer}</span>
          <span className="text-2xl font-bold text-green-400">
            {whiteSummary.accuracy.toFixed(1)}%
          </span>
        </div>
        <div className="flex flex-wrap gap-2 text-sm">
          {whiteSummary.brilliant > 0 && (
            <span className="bg-purple-600 px-2 py-1 rounded">
              ✨ {whiteSummary.brilliant} Brilliant
            </span>
          )}
          {whiteSummary.best > 0 && (
            <span className="bg-green-600 px-2 py-1 rounded">
              ✓ {whiteSummary.best} Best
            </span>
          )}
          {whiteSummary.excellent > 0 && (
            <span className="bg-green-500 px-2 py-1 rounded">
              {whiteSummary.excellent} Excellent
            </span>
          )}
          {whiteSummary.mistakes > 0 && (
            <span className="bg-orange-500 px-2 py-1 rounded">
              {whiteSummary.mistakes} Mistakes
            </span>
          )}
          {whiteSummary.blunders > 0 && (
            <span className="bg-red-600 px-2 py-1 rounded">
              ⚠ {whiteSummary.blunders} Blunders
            </span>
          )}
        </div>
      </div>

      {/* Black Player */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-medium">{blackPlayer}</span>
          <span className="text-2xl font-bold text-green-400">
            {blackSummary.accuracy.toFixed(1)}%
          </span>
        </div>
        <div className="flex flex-wrap gap-2 text-sm">
          {blackSummary.brilliant > 0 && (
            <span className="bg-purple-600 px-2 py-1 rounded">
              ✨ {blackSummary.brilliant} Brilliant
            </span>
          )}
          {blackSummary.best > 0 && (
            <span className="bg-green-600 px-2 py-1 rounded">
              ✓ {blackSummary.best} Best
            </span>
          )}
          {blackSummary.excellent > 0 && (
            <span className="bg-green-500 px-2 py-1 rounded">
              {blackSummary.excellent} Excellent
            </span>
          )}
          {blackSummary.mistakes > 0 && (
            <span className="bg-orange-500 px-2 py-1 rounded">
              {blackSummary.mistakes} Mistakes
            </span>
          )}
          {blackSummary.blunders > 0 && (
            <span className="bg-red-600 px-2 py-1 rounded">
              ⚠ {blackSummary.blunders} Blunders
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
