import { useState, useEffect } from 'react';

interface PGNUploadProps {
  onAnalyze: (pgn: string) => void;
  isLoading?: boolean;
}

const SAMPLE_PGN = `[Event "F/S Return Match"]
[Site "Belgrade, Serbia JUG"]
[Date "1992.11.04"]
[Round "29"]
[White "Fischer, Robert J."]
[Black "Spassky, Boris V."]
[Result "1/2-1/2"]

1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. Re1 b5 7. Bb3 d6 8. c3
O-O 9. h3 Nb8 10. d4 Nbd7 11. c4 c6 12. cxb5 axb5 13. Nc3 Bb7 14. Bg5 b4 15.
Nb1 h6 16. Bh4 c5 17. dxe5 Nxe4 18. Bxe7 Qxe7 19. exd6 Qf6 20. Nbd2 Nxd6 21.
Nc4 Nxc4 22. Bxc4 Nb6 23. Ne5 Rae8 24. Bxf7+ Rxf7 25. Nxf7 Rxe1+ 26. Qxe1 Kxf7
27. Qe3 Qg5 28. Qxg5 hxg5 29. b3 Ke6 30. a3 Kd6 31. axb4 cxb4 32. Ra5 Nd5 33.
f3 Bc8 34. Kf2 Bf5 35. Ra7 g6 36. Ra6+ Kc5 37. Ke1 Nf4 38. g3 Nxh3 39. Kd2 Kb5
40. Rd6 Kc5 41. Ra6 Nf2 42. g4 Bd3 43. Re6 1/2-1/2`;

const Icons = {
  Check: () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  ),
  Rocket: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  ),
  FileText: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  Alert: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  )
};

export function PGNUpload({ onAnalyze, isLoading = false }: PGNUploadProps) {
  const [pgn, setPgn] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  // Prevent page scrolling (single-page, no scroll)
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!pgn.trim()) {
      setError('Please enter a valid PGN game notation');
      return;
    }

    onAnalyze(pgn);
  };

  const loadSample = () => {
    setPgn(SAMPLE_PGN);
    setError(null);
  };

  return (
    <div className="h-screen relative bg-zinc-950 flex items-center justify-center p-6 overflow-hidden selection:bg-green-500/30">
      
      {/* Ambient Background Effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] bg-gradient-to-b from-green-500/10 to-transparent pointer-events-none blur-3xl" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[100px] pointer-events-none" />
      
      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>
      
      <div className="max-w-4xl w-full space-y-8 relative z-10">
        
        {/* Header Section */}
        <div className="text-center space-y-6">
          <div className="inline-block relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-green-500 to-blue-500 rounded-lg blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
            <h1 className="relative text-6xl md:text-7xl font-black tracking-tighter bg-gradient-to-r from-white via-green-100 to-zinc-400 bg-clip-text text-transparent pb-2">
              Honeypot<span className="text-green-500">.</span>Engine
            </h1>
          </div>
          
            <p className="text-xl text-zinc-400 max-w-4xl mx-auto font-light">
            Unleash grandmaster-level insights. Analyze your chess games with <strong>Stockfish AI</strong>.
          </p>
          <div className="flex flex-wrap justify-center gap-3 text-sm">
            {[
              'Move Classification',
              'Accuracy Analysis',
              'Best Move Suggestions'
            ].map((feature, idx) => (
              <div key={idx} className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md text-zinc-300 shadow-sm">
                <span className="text-green-400 flex items-center justify-center bg-green-400/10 w-5 h-5 rounded-full">
                  <Icons.Check />
                </span>
                <span>{feature}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-zinc-900/60 backdrop-blur-xl rounded-3xl p-1 shadow-2xl border border-white/10 ring-1 ring-white/5">
          <form onSubmit={handleSubmit} className="bg-zinc-950/50 rounded-[1.3rem] p-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label htmlFor="pgn-input" className="text-sm font-medium text-zinc-400 uppercase tracking-wider pl-1">
                  Portable Game Notation (PGN)
                </label>
                <span className="text-xs text-zinc-500 font-mono">.pgn format supported</span>
              </div>

              <div className={`relative group transition-all duration-200 ${isDragOver ? 'scale-[1.01]' : ''}`}>
                <div className="absolute -inset-0.5 bg-gradient-to-r from-green-500/20 to-blue-500/20 rounded-xl blur opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition duration-500"></div>
                <textarea
                  id="pgn-input"
                  value={pgn}
                  onChange={(e) => setPgn(e.target.value)}
                  onFocus={() => setIsDragOver(true)}
                  onBlur={() => setIsDragOver(false)}
                  className="relative w-full h-48 px-6 py-5 bg-zinc-900/80 border border-zinc-800 rounded-xl 
                           text-zinc-100 font-mono text-sm focus:outline-none focus:ring-1 focus:ring-green-500/50 focus:border-green-500/50
                           resize-none transition-all placeholder:text-zinc-600 shadow-inner custom-scrollbar"
                  placeholder="[Event &quot;...&quot;]&#10;1. e4 e5 2. Nf3..."
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="animate-in slide-in-from-top-2 fade-in duration-300 flex items-center gap-3 bg-red-500/10 border border-red-500/20 text-red-200 px-5 py-4 rounded-xl">
                <Icons.Alert />
                <p className="text-sm font-medium">{error}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 group relative inline-flex items-center justify-center gap-2 px-8 py-4 
                         bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 
                         text-white font-bold text-lg rounded-xl transition-all duration-200 
                         disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-green-900/20 
                         hover:shadow-green-500/30 hover:-translate-y-0.5 active:translate-y-0"
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <>
                    <Icons.Rocket />
                    <span>Analyze Game</span>
                  </>
                )}
              </button>
              
              <button
                type="button"
                onClick={loadSample}
                disabled={isLoading}
                className="flex-none flex items-center justify-center gap-2 px-8 py-4 bg-zinc-800/50 hover:bg-zinc-800 
                         text-zinc-300 font-semibold text-lg rounded-xl transition-all duration-200 
                         disabled:opacity-50 disabled:cursor-not-allowed border border-zinc-700/50 hover:border-zinc-600
                         hover:text-white hover:-translate-y-0.5"
              >
                <Icons.FileText />
                <span>Load Sample</span>
              </button>
            </div>
          </form>
        </div>
        


      </div>
    </div>
  );
}