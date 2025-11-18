/**
 * TypeScript type definitions for game analysis.
 */

export type MoveClassification =
  | 'theory'
  | 'best'
  | 'excellent'
  | 'great'
  | 'good'
  | 'brilliant'
  | 'mistake'
  | 'miss'
  | 'blunder';

export type PlayerSide = 'white' | 'black';

export interface EngineEvaluation {
  best_move: string;
  played_eval_cp: number;
  best_eval_cp: number;
  eval_diff_cp: number;
  win_probability: number;
}

export interface MoveArrow {
  from: string;
  to: string;
  type: 'best';
}

export interface MoveAnalysis {
  index: number;
  side: PlayerSide;
  san: string;
  uci: string;
  fen_before: string;
  fen_after: string;
  engine: EngineEvaluation;
  classification: MoveClassification;
  accuracy: number;
  opening: boolean;
  arrows: MoveArrow[];
}

export interface PlayerSummary {
  accuracy: number;
  blunders: number;
  mistakes: number;
  misses: number;
  brilliant: number;
  best: number;
  excellent: number;
  great: number;
  good: number;
}

export interface GameSummary {
  white: PlayerSummary;
  black: PlayerSummary;
}

export interface GameAnalysisResult {
  task_id: string;
  headers: Record<string, string>;
  moves: MoveAnalysis[];
  summary: GameSummary;
}

export interface AnalysisRequest {
  pgn: string;
  engine_depth?: number;
  time_per_move_ms?: number;
}

export interface AnalysisStartResponse {
  task_id: string;
  status: 'started';
  total_moves: number;
}

export interface StreamingUpdate {
  task_id: string;
  move_index: number;
  classification: string;
  played_eval_cp: number;
  best_eval_cp: number;
  diff_cp: number;
  best_move: string;
  fen: string;
  progress: number;
}

export interface CompletionMessage {
  task_id: string;
  status: 'complete';
  total_moves: number;
}

export type WebSocketMessage = StreamingUpdate | CompletionMessage;

export interface HealthResponse {
  status: 'healthy' | 'unhealthy';
  engine_available: boolean;
  message?: string;
}
