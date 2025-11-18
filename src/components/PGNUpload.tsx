/**
 * Component for uploading and submitting PGN for analysis.
 */

import { useState } from 'react';

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

export function PGNUpload({ onAnalyze, isLoading = false }: PGNUploadProps) {
  const [pgn, setPgn] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!pgn.trim()) {
      setError('Please enter a PGN');
      return;
    }

    onAnalyze(pgn);
  };

  const loadSample = () => {
    setPgn(SAMPLE_PGN);
    setError(null);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="pgn-input" className="block text-sm font-medium mb-2">
            Paste PGN
          </label>
          <textarea
            id="pgn-input"
            value={pgn}
            onChange={(e) => setPgn(e.target.value)}
            className="w-full h-64 px-4 py-3 bg-dark-surface border border-dark-border rounded-lg 
                     text-dark-text font-mono text-sm focus:ring-2 focus:ring-green-500 
                     focus:border-transparent resize-none"
            placeholder="Paste your PGN here..."
            disabled={isLoading}
          />
        </div>

        {error && (
          <div className="bg-red-900 bg-opacity-30 border border-red-500 text-red-200 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 
                     text-white font-semibold rounded-lg transition-colors duration-200
                     disabled:cursor-not-allowed"
          >
            {isLoading ? 'Analyzing...' : 'Analyze Game'}
          </button>
          
          <button
            type="button"
            onClick={loadSample}
            disabled={isLoading}
            className="px-6 py-3 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800
                     text-white font-semibold rounded-lg transition-colors duration-200
                     disabled:cursor-not-allowed"
          >
            Load Sample
          </button>
        </div>
      </form>
    </div>
  );
}
