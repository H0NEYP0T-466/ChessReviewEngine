import chess
from typing import Literal
from ..config import settings
from ..utils.logging import logger


MoveClassification = Literal[
    "theory", "best", "excellent", "great", "good",
    "brilliant", "inaccuracy", "mistake", "blunder"
]


def classify_move_by_winrate(
    best_eval_cp: int,
    played_eval_cp: int,
    played_move: chess.Move,
    best_move: str,
    is_opening: bool = False,
    board: chess.Board = None,
    player_turn_white: bool = True
) -> MoveClassification:
    """
    Classify a move based on win-rate loss and strategic patterns.
    
    CRITICAL RULES:
    1. If played_move matches best_move, it CANNOT be worse than "excellent"
    2. Brilliant moves must be:
       - The best engine move
       - AND meet one of these criteria:
         a) Sacrifice that genuinely loses material but improves position
         b) Move to an attacked square that improves position
    """
    # Check for checkmate
    if board:
        board_after = board.copy()
        board_after.push(played_move)
        if board_after.is_checkmate():
            logger.info(f"Checkmate detected: {played_move} - classifying as 'best'")
            return "best"
    
    # Determine if this is the best move
    played_move_uci = played_move.uci()
    is_best_move = (played_move_uci == best_move)
    
    # Calculate win probability loss
    best_win_pct = compute_win_probability(best_eval_cp) * 100
    played_win_pct = compute_win_probability(played_eval_cp) * 100
    win_loss_pct = best_win_pct - played_win_pct
    
    # Garbage time detection (position already winning/losing heavily)
    is_garbage_time = abs(best_eval_cp) > 700
    
    # RULE 1: Best move CANNOT be classified worse than "excellent"
    if is_best_move:
        # Check for brilliant patterns FIRST (only for best moves)
        if board and not is_garbage_time:
            brilliant_type = _check_brilliant_patterns(
                played_move, board, best_eval_cp, played_eval_cp
            )
            if brilliant_type:
                logger.info(
                    f"BRILLIANT move detected: {played_move} - {brilliant_type}"
                )
                return "brilliant"
        
        # Opening theory
        if is_opening and win_loss_pct <= 2.0:
            return "theory"
        
        # Best move classification (cannot be worse than excellent)
        if win_loss_pct <= 1.0:
            return "best"
        else:
            # Even if win rate drops slightly, best move = at least "excellent"
            return "excellent"
    
    # For NON-best moves, use standard win-rate classification
    if is_opening and win_loss_pct <= 2.0:
        return "theory"
    
    # Garbage time: be more lenient
    if is_garbage_time:
        if win_loss_pct <= 2.0:
            return "best"
        else:
            return "excellent"
    
    # Standard win-rate thresholds for non-best moves
    if win_loss_pct <= 1.0:
        return "best"
    elif win_loss_pct <= 2.0:
        return "excellent"
    elif win_loss_pct <= 5.0:
        return "great"
    elif win_loss_pct <= 10.0:
        return "good"
    elif win_loss_pct <= 20.0:
        return "inaccuracy"
    elif win_loss_pct <= 30.0:
        return "mistake"
    else:
        return "blunder"


def _check_brilliant_patterns(
    move: chess.Move,
    board: chess.Board,
    eval_before: int,
    eval_after: int
) -> str | None:
    """
    Check if a move qualifies as brilliant based on strategic patterns.
    
    Brilliant criteria:
    1. Real sacrifice: Lose material but position improves significantly
    2. Attacked square move: Move to attacked square but it's strategically strong
    
    Returns:
        Description of brilliant pattern, or None if not brilliant
    """
    piece = board.piece_at(move.from_square)
    if piece is None:
        return None
    
    piece_value = _get_piece_value(piece.piece_type)
    is_capture = board.is_capture(move)
    
    # Create board after move to analyze
    board_after = board.copy()
    board_after.push(move)
    
    # Pattern 1: REAL SACRIFICE (capturing with more valuable piece)
    if is_capture:
        captured_piece = board.piece_at(move.to_square)
        if captured_piece:
            captured_value = _get_piece_value(captured_piece.piece_type)
            
            # Check if we're giving up more material
            if piece_value > captured_value:
                # Now check: Can our piece ACTUALLY be recaptured?
                can_be_recaptured = board_after.is_attacked_by(
                    not board.turn, move.to_square
                )
                
                if can_be_recaptured:
                    # Count attackers vs defenders AFTER the capture
                    attackers = list(board_after.attackers(not board.turn, move.to_square))
                    defenders = list(board_after.attackers(board.turn, move.to_square))
                    
                    # Material will be lost if attackers > defenders
                    net_material_loss = piece_value - captured_value
                    
                    if len(attackers) > len(defenders):
                        logger.info(
                            f"REAL SACRIFICE: {piece.symbol()}({piece_value}) x "
                            f"{captured_piece.symbol()}({captured_value}) can be recaptured. "
                            f"Net loss: {net_material_loss}. Attackers: {len(attackers)}, "
                            f"Defenders: {len(defenders)}"
                        )
                        return f"Real sacrifice: losing {net_material_loss} material"
    
    # Pattern 2: HANGING PIECE SACRIFICE (non-capture to attacked square)
    if not is_capture:
        # Check if destination square is attacked by opponent
        is_attacked = board_after.is_attacked_by(not board.turn, move.to_square)
        
        if is_attacked:
            # Count attackers and defenders
            attackers = list(board_after.attackers(not board.turn, move.to_square))
            defenders = list(board_after.attackers(board.turn, move.to_square))
            
            # If more attackers than defenders, piece is hanging
            if len(attackers) > len(defenders):
                logger.info(
                    f"BRILLIANT HANGING MOVE: {piece.symbol()} to {chess.square_name(move.to_square)}. "
                    f"Attackers: {len(attackers)}, Defenders: {len(defenders)}. "
                    f"Risking {piece_value} material for positional gain."
                )
                return f"Strategic piece placement on attacked square"
    
    return None


def _get_piece_value(piece_type: int) -> int:
    """Get standard material value for a piece."""
    values = {
        chess.PAWN: 1,
        chess.KNIGHT: 3,
        chess.BISHOP: 3,
        chess.ROOK: 5,
        chess.QUEEN: 9,
        chess.KING: 0
    }
    return values.get(piece_type, 0)


def classify_move(
    diff_cp: int,
    played_move: chess.Move,
    best_move: str,
    is_opening: bool = False,
    board: chess.Board = None,
    eval_before: int = 0,
    eval_after: int = 0
) -> MoveClassification:
    """
    Legacy classification function using centipawn loss.
    
    NOTE: This enforces the same rule - best moves cannot be worse than excellent.
    """
    if board:
        board_after = board.copy()
        board_after.push(played_move)
        
        if board_after.is_checkmate():
            logger.info(f"Checkmate detected: {played_move} - classifying as 'best'")
            return "best"
    
    played_move_uci = played_move.uci()
    is_best_move = (played_move_uci == best_move)
    
    # RULE 1: Best move cannot be worse than excellent
    if is_best_move:
        if board:
            brilliant_type = _check_brilliant_patterns(
                played_move, board, eval_before, eval_after
            )
            if brilliant_type:
                logger.info(f"Brilliant move detected: {played_move} - {brilliant_type}")
                return "brilliant"
        
        if is_opening and diff_cp <= settings.THRESHOLD_BEST:
            return "theory"
        
        if diff_cp <= settings.THRESHOLD_BEST:
            return "best"
        else:
            # Best move should be at least "excellent" even with some eval loss
            return "excellent"
    
    # Standard classification for non-best moves
    if is_opening and diff_cp <= settings.THRESHOLD_BEST:
        return "theory"
    
    if diff_cp <= settings.THRESHOLD_BEST:
        return "best"
    elif diff_cp <= settings.THRESHOLD_EXCELLENT:
        return "excellent"
    elif diff_cp <= settings.THRESHOLD_GREAT:
        return "great"
    elif diff_cp <= settings.THRESHOLD_GOOD:
        return "good"
    elif diff_cp <= settings.THRESHOLD_INACCURACY:
        return "inaccuracy"
    elif diff_cp <= settings.THRESHOLD_MISTAKE:
        return "mistake"
    else:
        return "blunder"


def calculate_accuracy(centipawn_losses: list[int], k_factor: int = None) -> float:
    """Calculate average accuracy from centipawn losses."""
    if not centipawn_losses:
        return 100.0
    
    k = k_factor or settings.ACCURACY_K_FACTOR
    
    import math
    total_accuracy = 0.0
    for cpl in centipawn_losses:
        move_accuracy = 100.0 * math.exp(-abs(cpl) / k)
        total_accuracy += move_accuracy
    
    avg_accuracy = total_accuracy / len(centipawn_losses)
    return round(avg_accuracy, 2)


def compute_win_probability(cp: int) -> float:
    """Convert centipawn evaluation to win probability."""
    import math
    clamped_cp = max(-10000, min(10000, cp))
    win_pct = 50 + 50 * (2 / (1 + math.exp(-0.004 * clamped_cp)) - 1)
    return round(win_pct / 100, 3)