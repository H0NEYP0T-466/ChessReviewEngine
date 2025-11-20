import chess
from typing import Literal, Optional
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
    player_turn_white: bool = True,
    previous_classification: Optional[str] = None,
    opponent_previous_classification: Optional[str] = None
) -> MoveClassification:
    """
    Classify a move based on win-rate loss and strategic patterns.
    
    STRICT RULES:
    1. NO opening moves can be "great" - only theory/best
    2. Top engine move = BEST or BRILLIANT (never great in opening)
    3. GREAT only in two scenarios:
       a) After YOUR brilliant move, next YOUR top engine move = GREAT
       b) After OPPONENT's mistake/miss/blunder, YOUR top engine move = GREAT
    4. Excellent = Not top move, but playable (minimal position harm)
    5. Good/Inaccuracy/Mistake/Blunder = standard thresholds
    
    Args:
        previous_classification: YOUR last move's classification
        opponent_previous_classification: OPPONENT's last move's classification
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
    
    # Calculate centipawn loss for additional context
    eval_diff_cp = max(0, best_eval_cp - played_eval_cp)
    
    # Garbage time detection (position already winning/losing heavily)
    is_garbage_time = abs(best_eval_cp) > 700
    
    logger.info(
        f"Classifying move {played_move}: is_best={is_best_move}, is_opening={is_opening}, "
        f"win_loss={win_loss_pct:.2f}%, eval_diff={eval_diff_cp}cp, "
        f"your_prev={previous_classification}, opp_prev={opponent_previous_classification}"
    )
    
    # === TOP ENGINE MOVE LOGIC ===
    if is_best_move:
        logger.info(f"Move {played_move} is the TOP ENGINE MOVE")
        
        # Check for brilliant patterns FIRST (only outside opening)
        if board and not is_garbage_time and not is_opening:
            brilliant_type = _check_brilliant_patterns(
                played_move, board, best_eval_cp, played_eval_cp
            )
            if brilliant_type:
                logger.info(
                    f"⭐ BRILLIANT move detected: {played_move} - {brilliant_type}"
                )
                return "brilliant"
        
        # === STRICT "GREAT" CRITERIA ===
        # RULE: NO opening moves can be "great"
        if not is_opening:
            # Scenario 1: After YOUR brilliant move, next YOUR top engine move = GREAT
            if previous_classification == "brilliant":
                logger.info(f"✨ Top engine move after YOUR BRILLIANT = GREAT (continuation)")
                return "great"
            
            # Scenario 2: After OPPONENT's mistake/miss/blunder, YOUR top engine move = GREAT
            if opponent_previous_classification in ["mistake", "blunder", "inaccuracy"]:
                logger.info(
                    f"✨ Top engine move after OPPONENT's {opponent_previous_classification} = GREAT (punishing)"
                )
                return "great"
        
        # === OPENING THEORY ===
        if is_opening:
            # In opening, top moves with minimal loss = theory
            if win_loss_pct <= 2.0 and eval_diff_cp <= 20:
                logger.info(f"📖 Top engine move in opening = THEORY")
                return "theory"
            else:
                # Top move but with some eval loss in opening = best
                logger.info(f"✓ Top engine move in opening = BEST")
                return "best"
        
        # === OUTSIDE OPENING ===
        # All other top moves (not meeting "great" criteria) = BEST
        logger.info(f"✓ Top engine move = BEST")
        return "best"
    
    # === NON-BEST MOVE LOGIC ===
    
    # OPENING THEORY for non-best moves (acceptable alternatives in known lines)
    if is_opening:
        # In opening, allow slightly suboptimal moves to be "theory"
        if win_loss_pct <= 2.0 and eval_diff_cp <= 30:
            logger.info(
                f"📖 Non-best move in opening = THEORY "
                f"(win_loss={win_loss_pct:.2f}%, eval_diff={eval_diff_cp}cp)"
            )
            return "theory"
    
    # Garbage time: be more lenient
    if is_garbage_time:
        if win_loss_pct <= 3.0:
            return "excellent"
        elif win_loss_pct <= 10.0:
            return "good"
        else:
            return "inaccuracy"
    
    # EXCELLENT = Playable alternative (not best, but doesn't harm position)
    # Very minimal win-rate loss (up to 2.5%)
    if win_loss_pct <= 2.5:
        logger.info(
            f"Move {played_move} is EXCELLENT (playable alternative, "
            f"win_loss={win_loss_pct:.2f}%)"
        )
        return "excellent"
    
    # GREAT can NEVER happen for non-best moves
    # Moving directly to GOOD threshold
    
    # GOOD = 2.5% - 8% loss
    if win_loss_pct <= 8.0:
        logger.info(f"Move {played_move} is GOOD (win_loss={win_loss_pct:.2f}%)")
        return "good"
    
    # INACCURACY = 8% - 15% loss
    if win_loss_pct <= 15.0:
        logger.info(f"Move {played_move} is INACCURACY (win_loss={win_loss_pct:.2f}%)")
        return "inaccuracy"
    
    # MISTAKE = 15% - 25% loss
    if win_loss_pct <= 25.0:
        logger.info(f"Move {played_move} is MISTAKE (win_loss={win_loss_pct:.2f}%)")
        return "mistake"
    
    # BLUNDER = >25% loss
    logger.info(f"Move {played_move} is BLUNDER (win_loss={win_loss_pct:.2f}%)")
    return "blunder"


def _check_brilliant_patterns(
    move: chess.Move,
    board: chess.Board,
    eval_before: int,
    eval_after: int
) -> str | None:
    """
    Check if a move qualifies as brilliant based on strategic patterns.
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
                            f"⭐ REAL SACRIFICE: {piece.symbol()}({piece_value}) x "
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
                    f"⭐ BRILLIANT HANGING MOVE: {piece.symbol()} to {chess.square_name(move.to_square)}. "
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
    """Legacy classification function (not used in main flow)."""
    if board:
        board_after = board.copy()
        board_after.push(played_move)
        
        if board_after.is_checkmate():
            return "best"
    
    played_move_uci = played_move.uci()
    is_best_move = (played_move_uci == best_move)
    
    if is_best_move:
        if board and not is_opening:
            brilliant_type = _check_brilliant_patterns(
                played_move, board, eval_before, eval_after
            )
            if brilliant_type:
                return "brilliant"
        
        if is_opening and diff_cp <= 20:
            return "theory"
        
        return "best"
    
    if is_opening and diff_cp <= 30:
        return "theory"
    
    if diff_cp <= settings.THRESHOLD_BEST:
        return "best"
    elif diff_cp <= settings.THRESHOLD_EXCELLENT:
        return "excellent"
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