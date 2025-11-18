/**
 * API client for HoneyPotEngine backend.
 */

import type {
  AnalysisRequest,
  AnalysisStartResponse,
  GameAnalysisResult,
  HealthResponse,
  StreamingUpdate,
  CompletionMessage,
  WebSocketMessage,
} from '../types/analysis';

const API_BASE_URL = 'http://localhost:8000';

/**
 * Start game analysis.
 */
export async function startAnalysis(
  request: AnalysisRequest
): Promise<AnalysisStartResponse> {
  const response = await fetch(`${API_BASE_URL}/api/analyze`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(error.detail || 'Failed to start analysis');
  }

  return response.json();
}

/**
 * Get complete game analysis result.
 */
export async function getGameAnalysis(
  taskId: string
): Promise<GameAnalysisResult> {
  const response = await fetch(`${API_BASE_URL}/api/game/${taskId}`);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(error.detail || 'Failed to fetch game analysis');
  }

  return response.json();
}

/**
 * Check API health.
 */
export async function checkHealth(): Promise<HealthResponse> {
  const response = await fetch(`${API_BASE_URL}/api/health`);
  return response.json();
}

/**
 * Create WebSocket connection for streaming updates.
 */
export function createWebSocket(
  taskId: string,
  onUpdate: (update: StreamingUpdate) => void,
  onComplete: (completion: CompletionMessage) => void,
  onError?: (error: Event) => void,
  onClose?: () => void
): WebSocket {
  const ws = new WebSocket(`ws://localhost:8000/ws/analyze/${taskId}`);

  ws.onmessage = (event) => {
    try {
      const message = JSON.parse(event.data) as WebSocketMessage;
      
      // Check if this is a completion message
      if ('status' in message && message.status === 'complete') {
        onComplete(message as CompletionMessage);
      } else {
        // Regular streaming update
        onUpdate(message as StreamingUpdate);
      }
    } catch (error) {
      console.error('Failed to parse WebSocket message:', error);
    }
  };

  ws.onerror = (error) => {
    console.error('WebSocket error:', error);
    onError?.(error);
  };

  ws.onclose = () => {
    console.log('WebSocket closed');
    onClose?.();
  };

  return ws;
}
