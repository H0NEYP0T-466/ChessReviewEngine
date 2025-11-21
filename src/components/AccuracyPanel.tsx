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
    <div className="bg-zinc-800 rounded-lg p-4 space-y-4">
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
          <span className="bg-gray-600 px-2 py-1 rounded">
            Theory: {whiteSummary.theory}
          </span>
          <span className="bg-blue-500 px-2 py-1 rounded">
            Good: {whiteSummary.good}
          </span>
          <span className="bg-blue-600 px-2 py-1 rounded">
            Great: {whiteSummary.great}
          </span>
          <span className="bg-green-600 px-2 py-1 rounded">
            ✓ Best: {whiteSummary.best}
          </span>
          <span className="bg-green-500 px-2 py-1 rounded">
            Excellent: {whiteSummary.excellent}
          </span>
          <span className="bg-purple-600 px-2 py-1 rounded">
            ✨ Brilliant: {whiteSummary.brilliant}
          </span>
          <span className="bg-orange-600 px-2 py-1 rounded">
            Inaccuracies: {whiteSummary.inaccuracies}
          </span>
          <span className="bg-orange-500 px-2 py-1 rounded">
            Mistakes: {whiteSummary.mistakes}
          </span>
          <span className="bg-red-600 px-2 py-1 rounded">
            ⚠ Blunders: {whiteSummary.blunders}
          </span>
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
          <span className="bg-gray-600 px-2 py-1 rounded">
            Theory: {blackSummary.theory}
          </span>
          <span className="bg-blue-500 px-2 py-1 rounded">
            Good: {blackSummary.good}
          </span>
          <span className="bg-blue-600 px-2 py-1 rounded">
            Great: {blackSummary.great}
          </span>
          <span className="bg-green-600 px-2 py-1 rounded">
            ✓ Best: {blackSummary.best}
          </span>
          <span className="bg-green-500 px-2 py-1 rounded">
            Excellent: {blackSummary.excellent}
          </span>
          <span className="bg-purple-600 px-2 py-1 rounded">
            ✨ Brilliant: {blackSummary.brilliant}
          </span>
          <span className="bg-orange-600 px-2 py-1 rounded">
            Inaccuracies: {blackSummary.inaccuracies}
          </span>
          <span className="bg-orange-500 px-2 py-1 rounded">
            Mistakes: {blackSummary.mistakes}
          </span>
          <span className="bg-red-600 px-2 py-1 rounded">
            ⚠ Blunders: {blackSummary.blunders}
          </span>
        </div>
      </div>
    </div>
  );
}
