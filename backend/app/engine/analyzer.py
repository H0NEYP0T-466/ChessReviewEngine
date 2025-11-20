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


def is_opening_phase(board: chess.Board, move_number: int, move: chess.Move) -> bool:
    """
    Intelligent opening phase detection.
    
    Opening ends when ANY of these conditions are met:
    1. Move number > 12 AND both sides have developed 3+ minor pieces
    2. Both sides have castled
    3. Queens are traded off
    4. A tactical blow occurs (capture with eval swing > 100cp, checks in early game)
    5. Move number > 20 (hard limit)
    """
    # Hard limits
    if move_number >= 20:
        return False
    
    if move_number < 4:  # First 4 moves always opening
        return True
    
    # Check for tactical complications (suggests opening theory is over)
    is_capture = board.is_capture(move)
    is_check = board.gives_check(move)
    
    # If there's a capture or check after move 8, likely leaving theory
    if move_number >= 8 and (is_capture or is_check):
        logger.info(f"Move {move_number}: Tactical complication detected (capture={is_capture}, check={is_check}) - likely middlegame")
        return False
    
    # Count developed pieces (not on starting squares)
    white_developed = 0
    black_developed = 0
    
    # White's starting squares for minor pieces: b1, c1, f1, g1
    # Black's starting squares: b8, c8, f8, g8
    white_minor_start = [chess.B1, chess.C1, chess.F1, chess.G1]
    black_minor_start = [chess.B8, chess.C8, chess.F8, chess.G8]
    
    for square in chess.SQUARES:
        piece = board.piece_at(square)
        if piece:
            # Count developed minor pieces
            if piece.piece_type in [chess.KNIGHT, chess.BISHOP]:
                if piece.color == chess.WHITE and square not in white_minor_start:
                    white_developed += 1
                elif piece.color == chess.BLACK and square not in black_minor_start:
                    black_developed += 1
    
    # Check castling rights (if castling happened, castling rights are lost)
    white_castled = not (board.has_kingside_castling_rights(chess.WHITE) or 
                        board.has_queenside_castling_rights(chess.WHITE))
    black_castled = not (board.has_kingside_castling_rights(chess.BLACK) or 
                        board.has_queenside_castling_rights(chess.BLACK))
    
    # If both sides castled, opening is over
    if white_castled and black_castled:
        logger.info(f"Move {move_number}: Both sides castled - middlegame")
        return False
    
    # Check if queens are traded
    white_queen_exists = False
    black_queen_exists = False
    for square in chess.SQUARES:
        piece = board.piece_at(square)
        if piece and piece.piece_type == chess.QUEEN:
            if piece.color == chess.WHITE:
                white_queen_exists = True
            else:
                black_queen_exists = True
    
    if not white_queen_exists and not black_queen_exists:
        logger.info(f"Move {move_number}: Queens traded - middlegame/endgame")
        return False
    
    # After move 12, if both sides developed 3+ pieces, opening is over
    if move_number >= 12 and white_developed >= 3 and black_developed >= 3:
        logger.info(f"Move {move_number}: Both sides developed (W:{white_developed}, B:{black_developed}) - middlegame")
        return False
    
    # Otherwise, still in opening
    return True


async def analyze_game(
    task_id: str,
    moves: list[chess.Move],
    headers: dict[str, str],
    depth: int,
    time_per_move_ms: int,
    ws_manager=None
) -> GameAnalysisResult:
    """
    Analyze a complete chess game move by move.
    """
    logger.info(f"Starting game analysis: task_id={task_id}, total_moves={len(moves)}, depth={depth}")
    
    # Initialize Stockfish engine
    engine = StockfishEngine(depth=depth)
    
    # Initialize chess board
    board = chess.Board()
    
    # Storage for move analyses
    move_analyses: list[MoveAnalysis] = []
    white_cpl: list[int] = []
    black_cpl: list[int] = []
    
    # Statistics counters
    white_stats = {"blunders": 0, "mistakes": 0, "inaccuracies": 0, "brilliant": 0,
                   "best": 0, "excellent": 0, "great": 0, "good": 0}
    black_stats = {"blunders": 0, "mistakes": 0, "inaccuracies": 0, "brilliant": 0,
                   "best": 0, "excellent": 0, "great": 0, "good": 0}
    
    # Track previous move classification PER PLAYER (THIS IS CRITICAL!)
    previous_white_classification = None
    previous_black_classification = None
    
    # ALSO track opponent's previous classification (for punishing errors)
    previous_white_opponent_classification = None  # Black's last move from White's perspective
    previous_black_opponent_classification = None  # White's last move from Black's perspective
    
    # Analyze each move
    for i, move in enumerate(moves):
        try:
            # Determine which side is moving
            side = "white" if board.turn == chess.WHITE else "black"
            
            # Capture position before move
            fen_before = board.fen()
            
            # Get SAN (Standard Algebraic Notation) and UCI notation
            san = board.san(move)
            uci = move.uci()
            
            # Get best move from engine at current position
            best_move_uci = engine.get_best_move(fen_before)
            if best_move_uci is None:
                best_move_uci = uci
            
            # Determine if current turn is white (for perspective)
            is_white_turn = (side == "white")
            
            # Get evaluation BEFORE the move (from player's perspective)
            best_eval_raw = get_cp_evaluation(engine, fen_before, perspective_white=True)
            best_eval_cp = best_eval_raw if is_white_turn else -best_eval_raw
            
            # SMART OPENING DETECTION: Check if we're still in opening phase
            is_opening = is_opening_phase(board, i, move)
            
            # Make the move
            board.push(move)
            fen_after = board.fen()
            
            # Check for checkmate
            is_checkmate = board.is_checkmate()
            
            # Get evaluation AFTER the move
            if is_checkmate:
                # Checkmate: assign maximum evaluation for the winner
                if is_white_turn:
                    played_eval_cp_white = 10000
                else:
                    played_eval_cp_white = -10000
                played_eval_cp = 10000
            else:
                played_eval_cp_white = get_cp_evaluation(engine, fen_after, perspective_white=True)
                played_eval_raw = get_cp_evaluation(engine, fen_after, perspective_white=True)
                played_eval_cp = played_eval_raw if is_white_turn else -played_eval_raw
            
            # Calculate evaluation difference (centipawn loss)
            eval_diff_cp = max(0, best_eval_cp - played_eval_cp)
            
            # === CRITICAL FIX: Get BOTH player's own previous move AND opponent's previous move ===
            if side == "white":
                player_previous_classification = previous_white_classification
                opponent_previous_classification = previous_white_opponent_classification  # Black's last move
            else:
                player_previous_classification = previous_black_classification
                opponent_previous_classification = previous_black_opponent_classification  # White's last move
            
            # Classify the move with BOTH contexts
            classification = classify_move_by_winrate(
                best_eval_cp=best_eval_cp,
                played_eval_cp=played_eval_cp,
                played_move=move,
                best_move=best_move_uci,
                is_opening=is_opening,
                board=chess.Board(fen_before),
                player_turn_white=is_white_turn,
                previous_classification=player_previous_classification,
                opponent_previous_classification=opponent_previous_classification
            )
            
            # Calculate move accuracy
            move_accuracy = calculate_accuracy([eval_diff_cp])
            
            # Create arrow annotations for best move
            arrows = []
            if best_move_uci and len(best_move_uci) >= 4:
                arrows.append(MoveArrow(
                    from_square=best_move_uci[:2],
                    to_square=best_move_uci[2:4],
                    type="best"
                ))
            
            # Create move analysis object
            move_analysis = MoveAnalysis(
                index=i,
                side=side,
                san=san,
                uci=uci,
                fen_before=fen_before,
                fen_after=fen_after,
                engine=EngineEvaluation(
                    best_move=best_move_uci,
                    played_eval_cp=played_eval_cp_white,
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
            
            # Update statistics
            if side == "white":
                white_cpl.append(eval_diff_cp)
                white_stats[classification] = white_stats.get(classification, 0) + 1
            else:
                black_cpl.append(eval_diff_cp)
                black_stats[classification] = black_stats.get(classification, 0) + 1
            
            # === UPDATE BOTH PLAYER-SPECIFIC AND OPPONENT-SPECIFIC CLASSIFICATIONS ===
            if side == "white":
                previous_white_classification = classification
                previous_black_opponent_classification = classification  # White's move from Black's perspective
            else:
                previous_black_classification = classification
                previous_white_opponent_classification = classification  # Black's move from White's perspective
            
            # Log move analysis
            logger.info(
                f"task_id={task_id} move_index={i} side={side} san={san} "
                f"best={best_move_uci} played_eval={played_eval_cp} best_eval={best_eval_cp} "
                f"diff={eval_diff_cp} classification={classification} opening={is_opening} "
                f"player_prev={player_previous_classification} opp_prev={opponent_previous_classification}"
            )
            
            # Send streaming update via WebSocket
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
            continue
    
    # Calculate overall accuracy for each player
    white_accuracy = calculate_accuracy(white_cpl) if white_cpl else 100.0
    black_accuracy = calculate_accuracy(black_cpl) if black_cpl else 100.0
    
    logger.info(f"Computed accuracy: task_id={task_id} white={white_accuracy:.2f} black={black_accuracy:.2f}")
    
    # Create game summary
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
    
    # Create complete game analysis result
    result = GameAnalysisResult(
        task_id=task_id,
        headers=headers,
        moves=move_analyses,
        summary=summary
    )
    
    # Store result in memory cache
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
    """
    Retrieve cached analysis result by task ID.
    """
    return analysis_storage.get(task_id)