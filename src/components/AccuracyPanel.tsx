/**
 * Refined Accuracy Panel with modern UI theme colors.
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
    <div className="bg-[#1a1a1e] border border-zinc-700/40 rounded-xl p-5 space-y-6 shadow-xl shadow-black/40">
      <h3 className="text-xl font-semibold mb-3 text-zinc-200 tracking-wide">
        Player Accuracy
      </h3>

      {/* Player Block Component */}
      {[ 
        { player: whitePlayer, data: whiteSummary },
        { player: blackPlayer, data: blackSummary },
      ].map(({ player, data }, idx) => (
        <div key={idx} className="space-y-3 pb-2 border-b border-zinc-700/30 last:border-none">
          
          <div className="flex items-center justify-between">
            <span className="font-medium text-zinc-300">{player}</span>
            <span className="text-3xl font-extrabold text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]">
              {data.accuracy.toFixed(1)}%
            </span>
          </div>

          <div className="flex flex-wrap gap-2 text-sm">
            <Badge color="bg-zinc-600/70">Theory: {data.theory}</Badge>
            <Badge color="bg-blue-500/80">Good: {data.good}</Badge>
            <Badge color="bg-blue-600/80">Great: {data.great}</Badge>
            <Badge color="bg-emerald-600/80">✓ Best: {data.best}</Badge>
            <Badge color="bg-emerald-500/80">Excellent: {data.excellent}</Badge>
            <Badge color="bg-purple-600/80">✨ Brilliant: {data.brilliant}</Badge>
            <Badge color="bg-amber-600/80">Inaccuracies: {data.inaccuracies}</Badge>
            <Badge color="bg-amber-500/80">Mistakes: {data.mistakes}</Badge>
            <Badge color="bg-red-600/80">⚠ Blunders: {data.blunders}</Badge>
          </div>
        </div>
      ))}
    </div>
  );
}

/* Reusable Badge Component */
function Badge({
  children,
  color,
}: {
  children: React.ReactNode;
  color: string;
}) {
  return (
    <span
      className={`${color} px-2.5 py-1 rounded-lg text-white shadow-md shadow-black/30 backdrop-blur-sm`}
    >
      {children}
    </span>
  );
}
