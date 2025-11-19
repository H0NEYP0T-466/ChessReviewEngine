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
import { startAnalysis, createWebSocket, getGameAnalysis } from './api/client';
import type { GameAnalysisResult, StreamingUpdate, CompletionMessage } from './types/analysis';

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
        // Handle streaming updates
        (update: StreamingUpdate) => {
          // Update progress
          setAnalysisProgress(update.progress);
        },
        // Handle completion message
        async (completion: CompletionMessage) => {
          console.log(`Analysis complete (${completion.total_moves} moves), fetching full results...`);
          try {
            // Fetch complete analysis
            const completeAnalysis = await getGameAnalysis(response.task_id);
            setGameAnalysis(completeAnalysis);
            setCurrentMoveIndex(0);
            toast.success('Analysis complete!');
          } catch (error) {
            console.error('Failed to fetch complete analysis:', error);
            toast.error('Failed to load complete analysis results');
          } finally {
            setIsAnalyzing(false);
          }
        },
        // Handle WebSocket error
        (error) => {
          console.error('WebSocket error:', error);
          toast.error('Connection error during analysis');
          setIsAnalyzing(false);
        },
        // Handle WebSocket close
        () => {
          console.log('WebSocket connection closed');
        }
      );
      
      setWs(websocket);
      
    } catch (error) {
      setIsAnalyzing(false);
      const errorMessage = error instanceof Error ? error.message : 'Failed to analyze game';
      toast.error(errorMessage);
      console.error('Analysis error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-dark-bg text-dark-text">
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-6">
        {!gameAnalysis ? (
          // Upload View
          <div className="space-y-6">
            <PGNUpload onAnalyze={handleAnalyze} isLoading={isAnalyzing} />
          </div>
        ) : (
          // Analysis View - Updated Layout
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Left column - Board and Accuracy */}
            <div className="flex-1 space-y-6">
              <AnalysisBoard
                moves={gameAnalysis.moves}
                currentMoveIndex={currentMoveIndex}
                onMoveIndexChange={setCurrentMoveIndex}
              />
              
              {/* Accuracy Panel below board */}
              <AccuracyPanel
                whiteSummary={gameAnalysis.summary.white}
                blackSummary={gameAnalysis.summary.black}
                whitePlayer={gameAnalysis.headers.White}
                blackPlayer={gameAnalysis.headers.Black}
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

            {/* Right column - Game Info and Move List */}
            <div className="lg:w-80 space-y-6">
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

              {/* Move List on the side */}
              <MoveList
                moves={gameAnalysis.moves}
                currentMoveIndex={currentMoveIndex}
                onMoveSelect={setCurrentMoveIndex}
              />
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
