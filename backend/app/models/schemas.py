"""Pydantic schemas for API request/response models."""

from typing import Optional, Literal
from pydantic import BaseModel, Field


class AnalysisRequest(BaseModel):
    """Request model for game analysis."""
    pgn: str = Field(..., max_length=20000)
    engine_depth: Optional[int] = Field(default=10, ge=1, le=30)
    time_per_move_ms: Optional[int] = Field(default=300, ge=50, le=5000)


class AnalysisStartResponse(BaseModel):
    """Response model for analysis initiation."""
    task_id: str
    status: Literal["started"]
    total_moves: int


class EngineEvaluation(BaseModel):
    """Engine evaluation details for a move."""
    best_move: str
    played_eval_cp: int
    best_eval_cp: int
    eval_diff_cp: int
    win_probability: float


class MoveArrow(BaseModel):
    """Arrow annotation for best move."""
    from_square: str = Field(..., alias="from")
    to_square: str = Field(..., alias="to")
    type: Literal["best"]
    
    class Config:
        populate_by_name = True


class MoveAnalysis(BaseModel):
    """Analysis result for a single move."""
    index: int
    side: Literal["white", "black"]
    san: str
    uci: str
    fen_before: str
    fen_after: str
    engine: EngineEvaluation
    classification: Literal[
        "theory", "best", "excellent", "great", "good",
        "brilliant", "inaccuracy", "mistake", "blunder"
    ]
    accuracy: float
    opening: bool
    arrows: list[MoveArrow] = []


class PlayerSummary(BaseModel):
    """Summary statistics for a player."""
    accuracy: float
    blunders: int = 0
    mistakes: int = 0
    inaccuracies: int = 0
    brilliant: int = 0
    best: int = 0
    excellent: int = 0
    great: int = 0
    good: int = 0


class GameSummary(BaseModel):
    """Summary of game analysis."""
    white: PlayerSummary
    black: PlayerSummary


class GameAnalysisResult(BaseModel):
    """Complete game analysis result."""
    task_id: str
    headers: dict[str, str]
    moves: list[MoveAnalysis]
    summary: GameSummary


class StreamingUpdate(BaseModel):
    """Streaming update for move analysis."""
    task_id: str
    move_index: int
    classification: str
    played_eval_cp: int
    best_eval_cp: int
    diff_cp: int
    best_move: str
    fen: str
    progress: float


class CompletionMessage(BaseModel):
    """Message sent when analysis is complete."""
    task_id: str
    status: Literal["complete"]
    total_moves: int


class HealthResponse(BaseModel):
    """Health check response."""
    status: Literal["healthy", "unhealthy"]
    engine_available: bool
    message: Optional[str] = None
