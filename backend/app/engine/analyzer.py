import chess
import asyncio
from typing import Optional
from ..engine.stockfish import StockfishEngine, get_cp_evaluation
from ..engine.classification import classify_move, classify_move_by_winrate, calculate_accuracy, compute_win_probability
from ..models.schemas import (
    MoveAnalysis, EngineEvaluation, PlayerSummary, GameSummary,
    GameAnalysisResult, StreamingUpdate, MoveArrow, CompletionMessage
)
from ..utils.logging import logger


analysis_storage: dict[str, GameAnalysisResult] = {}


async def analyze_game(
    task_id: str,
    moves: list[chess.Move],
    headers: dict[str, str],
    depth: int,
    time_per_move_ms: int,
    ws_manager=None
) -> GameAnalysisResult:
    logger.info(f"Starting game analysis: task_id={task_id}, total_moves={len(moves)}, depth={depth}")
    
    engine = StockfishEngine(depth=depth)
    
    board = chess.Board()
    
    move_analyses: list[MoveAnalysis] = []
    white_cpl: list[int] = []
    black_cpl: list[int] = []
    
    white_stats = {"blunders": 0, "mistakes": 0, "inaccuracies": 0, "brilliant": 0,
                   "best": 0, "excellent": 0, "great": 0, "good": 0}
    black_stats = {"blunders": 0, "mistakes": 0, "inaccuracies": 0, "brilliant": 0,
                   "best": 0, "excellent": 0, "great": 0, "good": 0}
    
    for i, move in enumerate(moves):
        try:
            side = "white" if board.turn == chess.WHITE else "black"
            
            fen_before = board.fen()
            
            san = board.san(move)
            uci = move.uci()
            
            best_move_uci = engine.get_best_move(fen_before)
            if best_move_uci is None:
                best_move_uci = uci
            
            best_eval_cp_white = get_cp_evaluation(engine, fen_before, perspective_white=True)
            
            is_white_turn = (side == "white")
            best_eval_raw = get_cp_evaluation(engine, fen_before, perspective_white=True)
            best_eval_cp = best_eval_raw if is_white_turn else -best_eval_raw
            
            board.push(move)
            fen_after = board.fen()
            
            is_checkmate = board.is_checkmate()
            
            if is_checkmate:
                if is_white_turn:
                    played_eval_cp_white = 10000
                else:
                    played_eval_cp_white = -10000
                played_eval_cp = 10000
            else:
                played_eval_cp_white = get_cp_evaluation(engine, fen_after, perspective_white=True)
                played_eval_raw = get_cp_evaluation(engine, fen_after, perspective_white=True)
                played_eval_cp = played_eval_raw if is_white_turn else -played_eval_raw
            
            eval_diff_cp = max(0, best_eval_cp - played_eval_cp)
            
            is_opening = i < 15
            classification = classify_move_by_winrate(
                best_eval_cp=best_eval_cp,
                played_eval_cp=played_eval_cp,
                played_move=move,
                best_move=best_move_uci,
                is_opening=is_opening,
                board=chess.Board(fen_before),
                player_turn_white=is_white_turn
            )
            
            move_accuracy = calculate_accuracy([eval_diff_cp])
            
            arrows = []
            if best_move_uci and len(best_move_uci) >= 4:
                arrows.append(MoveArrow(
                    from_square=best_move_uci[:2],
                    to_square=best_move_uci[2:4],
                    type="best"
                ))
            
            move_analysis = MoveAnalysis(
                index=i,
                side=side,
                san=san,
                uci=uci,
                fen_before=fen_before,
                fen_after=fen_after,
                engine=EngineEvaluation(
                    best_move=best_move_uci,
                    played_eval_cp=played_eval_cp_white,  # Always from White's perspective
                    best_eval_cp=best_eval_cp,  # From player's perspective
                    eval_diff_cp=eval_diff_cp,
                    win_probability=compute_win_probability(played_eval_cp)  # From player's perspective
                ),
                classification=classification,
                accuracy=move_accuracy,
                opening=is_opening,
                arrows=arrows
            )
            
            move_analyses.append(move_analysis)
            
            if side == "white":
                white_cpl.append(eval_diff_cp)
                white_stats[classification] = white_stats.get(classification, 0) + 1
            else:
                black_cpl.append(eval_diff_cp)
                black_stats[classification] = black_stats.get(classification, 0) + 1
            
            logger.info(
                f"task_id={task_id} move_index={i} side={side} san={san} "
                f"best={best_move_uci} played_eval={played_eval_cp} best_eval={best_eval_cp} "
                f"diff={eval_diff_cp} classification={classification}"
            )
            
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
            
            await asyncio.sleep(0.01)
            
        except Exception as e:
            logger.error(f"Error analyzing move {i}: {str(e)}")
            continue
    
    white_accuracy = calculate_accuracy(white_cpl) if white_cpl else 100.0
    black_accuracy = calculate_accuracy(black_cpl) if black_cpl else 100.0
    
    logger.info(f"Computed accuracy: task_id={task_id} white={white_accuracy:.2f} black={black_accuracy:.2f}")
    
    summary = GameSummary(
        white=PlayerSummary(
            accuracy=white_accuracy,
            blunders=white_stats.get("blunder", 0),
            mistakes=white_stats.get("mistake", 0),
            inaccuracies=white_stats.get("inaccuracy", 0),
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
            inaccuracies=black_stats.get("inaccuracy", 0),
            brilliant=black_stats.get("brilliant", 0),
            best=black_stats.get("best", 0),
            excellent=black_stats.get("excellent", 0),
            great=black_stats.get("great", 0),
            good=black_stats.get("good", 0)
        )
    )
    
    result = GameAnalysisResult(
        task_id=task_id,
        headers=headers,
        moves=move_analyses,
        summary=summary
    )
    
    analysis_storage[task_id] = result
    
    logger.info(f"Analysis complete: task_id={task_id}")
    
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
    return analysis_storage.get(task_id)
