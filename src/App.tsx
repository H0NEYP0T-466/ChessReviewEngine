/**
 * HoneyPotEngine - Main Application Component
 * Chess Game Review System
 */

import { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster, toast } from 'react-hot-toast';
import { PGNUpload } from './components/PGNUpload';
import { AnalysisBoard } from './components/AnalysisBoard';
import { MoveList } from './components/MoveList';
import { AccuracyPanel } from './components/AccuracyPanel';
import { LoadingOverlay } from './components/LoadingOverlay';
import { startAnalysis, createWebSocket } from './api/client';
import type { GameAnalysisResult, StreamingUpdate } from './types/analysis';

const queryClient = new QueryClient();

function AppContent() {
  const [gameAnalysis, setGameAnalysis] = useState<GameAnalysisResult | null>(null);
  const [currentMoveIndex, setCurrentMoveIndex] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [ws, setWs] = useState<WebSocket | null>(null);

  // Cleanup WebSocket on unmount
  useEffect(() => {
    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, [ws]);

  const handleAnalyze = async (pgn: string) => {
    try {
      setIsAnalyzing(true);
      setAnalysisProgress(0);
      setGameAnalysis(null);
      
      // Start analysis
      const response = await startAnalysis({ pgn });
      
      toast.success(`Analysis started! Total moves: ${response.total_moves}`);
      
      // Connect to WebSocket for live updates
      const websocket = createWebSocket(
        response.task_id,
        (update: StreamingUpdate) => {
          // Update progress
          setAnalysisProgress(update.progress);
          
          // Build up moves incrementally
          setGameAnalysis((prev) => {
            if (!prev) {
              return {
                task_id: response.task_id,
                headers: {},
                moves: [],
                summary: {
                  white: { accuracy: 0, blunders: 0, mistakes: 0, misses: 0, brilliant: 0, best: 0, excellent: 0, great: 0, good: 0 },
                  black: { accuracy: 0, blunders: 0, mistakes: 0, misses: 0, brilliant: 0, best: 0, excellent: 0, great: 0, good: 0 },
                },
              };
            }
            return prev;
          });
        },
        (error) => {
          console.error('WebSocket error:', error);
          toast.error('Connection error during analysis');
        },
        () => {
          // Analysis complete
          setIsAnalyzing(false);
          toast.success('Analysis complete!');
        }
      );
      
      setWs(websocket);
      
      // Poll for complete results
      // In a real implementation, you'd fetch the complete result when WebSocket closes
      setTimeout(async () => {
        try {
          // Fetch complete analysis
          const completeAnalysis = await fetch(`http://localhost:8000/api/game/${response.task_id}`).then(r => r.json());
          setGameAnalysis(completeAnalysis);
          setCurrentMoveIndex(0);
        } catch (error) {
          console.error('Failed to fetch complete analysis:', error);
        } finally {
          setIsAnalyzing(false);
        }
      }, response.total_moves * 500); // Rough estimate based on moves
      
    } catch (error) {
      setIsAnalyzing(false);
      const errorMessage = error instanceof Error ? error.message : 'Failed to analyze game';
      toast.error(errorMessage);
      console.error('Analysis error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-dark-bg text-dark-text">
      {/* Header */}
      <header className="bg-dark-surface border-b border-dark-border py-6 px-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold text-center">
            🍯 <span className="text-green-400">HoneyPotEngine</span>
          </h1>
          <p className="text-center text-gray-400 mt-2">
            Chess Game Review System - Powered by Stockfish
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {!gameAnalysis ? (
          // Upload View
          <div className="space-y-6">
            <PGNUpload onAnalyze={handleAnalyze} isLoading={isAnalyzing} />
          </div>
        ) : (
          // Analysis View
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left column - Board */}
            <div className="lg:col-span-2">
              <AnalysisBoard
                moves={gameAnalysis.moves}
                currentMoveIndex={currentMoveIndex}
                onMoveIndexChange={setCurrentMoveIndex}
              />
            </div>

            {/* Right column - Moves and Stats */}
            <div className="space-y-6">
              {/* Game Info */}
              <div className="bg-dark-surface rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-2">Game Info</h3>
                <div className="space-y-1 text-sm">
                  {gameAnalysis.headers.Event && (
                    <div><span className="text-gray-400">Event:</span> {gameAnalysis.headers.Event}</div>
                  )}
                  {gameAnalysis.headers.White && (
                    <div><span className="text-gray-400">White:</span> {gameAnalysis.headers.White}</div>
                  )}
                  {gameAnalysis.headers.Black && (
                    <div><span className="text-gray-400">Black:</span> {gameAnalysis.headers.Black}</div>
                  )}
                  {gameAnalysis.headers.Result && (
                    <div><span className="text-gray-400">Result:</span> {gameAnalysis.headers.Result}</div>
                  )}
                </div>
              </div>

              {/* Accuracy Panel */}
              <AccuracyPanel
                whiteSummary={gameAnalysis.summary.white}
                blackSummary={gameAnalysis.summary.black}
                whitePlayer={gameAnalysis.headers.White}
                blackPlayer={gameAnalysis.headers.Black}
              />

              {/* Move List */}
              <MoveList
                moves={gameAnalysis.moves}
                currentMoveIndex={currentMoveIndex}
                onMoveSelect={setCurrentMoveIndex}
              />

              {/* New Analysis Button */}
              <button
                onClick={() => {
                  setGameAnalysis(null);
                  setCurrentMoveIndex(0);
                }}
                className="w-full px-6 py-3 bg-gray-700 hover:bg-gray-600 
                         text-white font-semibold rounded-lg transition-colors"
              >
                Analyze Another Game
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Loading Overlay */}
      {isAnalyzing && (
        <LoadingOverlay
          progress={analysisProgress}
          message="Analyzing game with Stockfish..."
        />
      )}

      {/* Toast Notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#2d2d2d',
            color: '#e0e0e0',
            border: '1px solid #404040',
          },
        }}
      />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
}

export default App;
