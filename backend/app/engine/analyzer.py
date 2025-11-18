"""Game analysis engine."""

import chess
import asyncio
from typing import Optional
from ..engine.stockfish import StockfishEngine, get_cp_evaluation
from ..engine.classification import classify_move, calculate_accuracy, compute_win_probability
from ..models.schemas import (
    MoveAnalysis, EngineEvaluation, PlayerSummary, GameSummary,
    GameAnalysisResult, StreamingUpdate, MoveArrow, CompletionMessage
)
from ..utils.logging import logger


# In-memory storage for analysis results
analysis_storage: dict[str, GameAnalysisResult] = {}


async def analyze_game(
    task_id: str,
    moves: list[chess.Move],
    headers: dict[str, str],
    depth: int,
    time_per_move_ms: int,
    ws_manager=None
) -> GameAnalysisResult:
    """
    Analyze a complete chess game.
    
    Args:
        task_id: Unique task identifier
        moves: List of chess moves
        headers: PGN headers
        depth: Engine search depth
        time_per_move_ms: Time per move in milliseconds (not currently used)
        ws_manager: WebSocket manager for streaming updates
        
    Returns:
        Complete game analysis result
    """
    logger.info(f"Starting game analysis: task_id={task_id}, total_moves={len(moves)}, depth={depth}")
    
    # Initialize engine
    engine = StockfishEngine(depth=depth)
    
    # Initialize board
    board = chess.Board()
    
    # Analysis results
    move_analyses: list[MoveAnalysis] = []
    white_cpl: list[int] = []
    black_cpl: list[int] = []
    
    white_stats = {"blunders": 0, "mistakes": 0, "misses": 0, "brilliant": 0,
                   "best": 0, "excellent": 0, "great": 0, "good": 0}
    black_stats = {"blunders": 0, "mistakes": 0, "misses": 0, "brilliant": 0,
                   "best": 0, "excellent": 0, "great": 0, "good": 0}
    
    # Analyze each move
    for i, move in enumerate(moves):
        try:
            # Determine side
            side = "white" if board.turn == chess.WHITE else "black"
            
            # Get FEN before move
            fen_before = board.fen()
            
            # Convert move to SAN before playing it
            san = board.san(move)
            uci = move.uci()
            
            # Get best move and evaluation before playing
            best_move_uci = engine.get_best_move(fen_before)
            if best_move_uci is None:
                best_move_uci = uci  # Fallback
            
            best_eval_cp = get_cp_evaluation(engine, fen_before, perspective_white=(side == "white"))
            
            # Play the actual move
            board.push(move)
            fen_after = board.fen()
            
            # Get evaluation after the played move
            played_eval_cp = get_cp_evaluation(engine, fen_after, perspective_white=(side == "white"))
            
            # Calculate difference (from the player's perspective, negative is worse)
            # We want absolute loss
            eval_diff_cp = abs(best_eval_cp - played_eval_cp)
            
            # Classify the move
            is_opening = i < 15  # Simple heuristic: first 15 moves are "opening"
            classification = classify_move(
                diff_cp=eval_diff_cp,
                played_move=move,
                best_move=best_move_uci,
                is_opening=is_opening,
                board=chess.Board(fen_before),  # Board before move for brilliant detection
                eval_before=best_eval_cp,
                eval_after=played_eval_cp
            )
            
            # Calculate move accuracy
            move_accuracy = calculate_accuracy([eval_diff_cp])
            
            # Create arrows for mistakes/misses/blunders
            arrows = []
            if classification in ["mistake", "miss", "blunder"] and best_move_uci:
                arrows.append(MoveArrow(
                    from_square=best_move_uci[:2],
                    to_square=best_move_uci[2:4],
                    type="best"
                ))
            
            # Create move analysis
            move_analysis = MoveAnalysis(
                index=i,
                side=side,
                san=san,
                uci=uci,
                fen_before=fen_before,
                fen_after=fen_after,
                engine=EngineEvaluation(
                    best_move=best_move_uci,
                    played_eval_cp=played_eval_cp,
                    best_eval_cp=best_eval_cp,
                    eval_diff_cp=eval_diff_cp,
                    win_probability=compute_win_probability(played_eval_cp)
                ),
                classification=classification,
                accuracy=move_accuracy,
                opening=is_opening,
                arrows=arrows
            )
            
            move_analyses.append(move_analysis)
            
            # Track CPL and stats
            if side == "white":
                white_cpl.append(eval_diff_cp)
                white_stats[classification] = white_stats.get(classification, 0) + 1
            else:
                black_cpl.append(eval_diff_cp)
                black_stats[classification] = black_stats.get(classification, 0) + 1
            
            # Log move analysis
            logger.info(
                f"task_id={task_id} move_index={i} side={side} san={san} "
                f"best={best_move_uci} played_eval={played_eval_cp} best_eval={best_eval_cp} "
                f"diff={eval_diff_cp} classification={classification}"
            )
            
            # Stream update via WebSocket
            if ws_manager:
                update = StreamingUpdate(
                    task_id=task_id,
                    move_index=i,
                    classification=classification,
                    played_eval_cp=played_eval_cp,
                    best_eval_cp=best_eval_cp,
                    diff_cp=eval_diff_cp,
                    best_move=best_move_uci,
                    fen=fen_after,
                    progress=round((i + 1) / len(moves), 3)
                )
                await ws_manager.broadcast(task_id, update.model_dump())
                logger.info(f"Streaming move {i} task_id={task_id}")
            
            # Small delay to prevent blocking
            await asyncio.sleep(0.01)
            
        except Exception as e:
            logger.error(f"Error analyzing move {i}: {str(e)}")
            # Continue with next move
            continue
    
    # Calculate final accuracy
    white_accuracy = calculate_accuracy(white_cpl) if white_cpl else 100.0
    black_accuracy = calculate_accuracy(black_cpl) if black_cpl else 100.0
    
    logger.info(f"Computed accuracy: task_id={task_id} white={white_accuracy:.2f} black={black_accuracy:.2f}")
    
    # Create summary
    summary = GameSummary(
        white=PlayerSummary(
            accuracy=white_accuracy,
            blunders=white_stats.get("blunder", 0),
            mistakes=white_stats.get("mistake", 0),
            misses=white_stats.get("miss", 0),
            brilliant=white_stats.get("brilliant", 0),
            best=white_stats.get("best", 0),
            excellent=white_stats.get("excellent", 0),
            great=white_stats.get("great", 0),
            good=white_stats.get("good", 0)
        ),
        black=PlayerSummary(
            accuracy=black_accuracy,
            blunders=black_stats.get("blunder", 0),
            mistakes=black_stats.get("mistake", 0),
            misses=black_stats.get("miss", 0),
            brilliant=black_stats.get("brilliant", 0),
            best=black_stats.get("best", 0),
            excellent=black_stats.get("excellent", 0),
            great=black_stats.get("great", 0),
            good=black_stats.get("good", 0)
        )
    )
    
    # Create final result
    result = GameAnalysisResult(
        task_id=task_id,
        headers=headers,
        moves=move_analyses,
        summary=summary
    )
    
    # Store result
    analysis_storage[task_id] = result
    
    logger.info(f"Analysis complete: task_id={task_id}")
    
    # Send completion message via WebSocket
    if ws_manager:
        completion = CompletionMessage(
            task_id=task_id,
            status="complete",
            total_moves=len(moves)
        )
        await ws_manager.broadcast(task_id, completion.model_dump())
        logger.info(f"Sent completion message for task_id={task_id}")
    
    return result


def get_analysis_result(task_id: str) -> Optional[GameAnalysisResult]:
    """Retrieve stored analysis result."""
    return analysis_storage.get(task_id)
