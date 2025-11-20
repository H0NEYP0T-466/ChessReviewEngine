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
    
    STRICT CLASSIFICATION ORDER:
    1. ALWAYS check for BRILLIANT first (even if not best move!)
    2. Check for GREAT (after your brilliant OR after opponent's error)
    3. Then apply theory/best/excellent/good/mistake/blunder logic
    
    BRILLIANT CRITERIA:
    - Must have sacrifice OR hanging piece pattern
    - Position must improve OR stay equal (minimal eval loss)
    - Even if not #1 engine choice, can still be brilliant if it's a strong sacrifice
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
    
    # === STEP 1: ALWAYS CHECK FOR BRILLIANT FIRST ===
    # CRITICAL FIX: Check for brilliant even if NOT the #1 engine move!
    # A move can be brilliant if it's a strong sacrifice with minimal eval loss
    if board and not is_garbage_time:
        # Check if move has brilliant pattern (sacrifice/hanging)
        brilliant_type = _check_brilliant_patterns(
            played_move, board, best_eval_cp, played_eval_cp, eval_diff_cp
        )
        if brilliant_type:
            # Verify that eval loss is acceptable for a brilliant move
            # Brilliant moves can lose some eval but not too much
            if eval_diff_cp <= 50:  # Less than 0.5 pawns worse
                logger.info(
                    f"⭐ BRILLIANT move detected: {played_move} - {brilliant_type} "
                    f"(eval_diff={eval_diff_cp}cp)"
                )
                return "brilliant"
            else:
                logger.info(
                    f"Sacrifice pattern detected but eval loss too high "
                    f"({eval_diff_cp}cp) - not brilliant"
                )
    
    # === STEP 2: CHECK FOR GREAT (ONLY FOR TOP ENGINE MOVES, NOT IN OPENING) ===
    if is_best_move and not is_opening:
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
    
    # === STEP 3: OPENING THEORY LOGIC ===
    if is_opening:
        # For TOP engine moves in opening
        if is_best_move:
            # In opening, top moves with minimal loss = theory
            if win_loss_pct <= 2.0 and eval_diff_cp <= 20:
                logger.info(f"📖 Top engine move in opening = THEORY")
                return "theory"
            else:
                # Top move but with some eval loss in opening = best
                logger.info(f"✓ Top engine move in opening (with eval loss) = BEST")
                return "best"
        
        # For NON-best moves in opening
        # Allow slightly suboptimal moves to be "theory"
        if win_loss_pct <= 2.0 and eval_diff_cp <= 30:
            logger.info(
                f"📖 Non-best move in opening = THEORY "
                f"(win_loss={win_loss_pct:.2f}%, eval_diff={eval_diff_cp}cp)"
            )
            return "theory"
    
    # === STEP 4: TOP ENGINE MOVE OUTSIDE OPENING ===
    if is_best_move and not is_opening:
        logger.info(f"✓ Top engine move outside opening = BEST")
        return "best"
    
    # === STEP 5: NON-BEST MOVES CLASSIFICATION ===
    
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
    eval_after: int,
    eval_diff_cp: int
) -> str | None:
    """
    Check if a move qualifies as brilliant based on strategic patterns.
    
    BRILLIANT CRITERIA:
    1. Must have sacrifice OR hanging piece pattern
    2. Position must improve OR stay roughly equal (eval_diff_cp <= 50)
    3. Does NOT need to be #1 engine move (can be second-best if it's spectacular)
    
    PATTERNS:
    A. Real sacrifice: Capture with more valuable piece, can be recaptured, loses material
    B. Hanging piece: Move piece to attacked square where it can be captured
    
    Args:
        eval_diff_cp: How much worse this move is compared to best (0 = best move)
    
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
    
    # === PATTERN 1: REAL SACRIFICE (capturing with more valuable piece) ===
    if is_capture:
        captured_piece = board.piece_at(move.to_square)
        if captured_piece:
            captured_value = _get_piece_value(captured_piece.piece_type)
            
            # Check if we're giving up more material (e.g., Knight takes pawn)
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
                    
                    # CRITICAL: We lose material, but position stays strong
                    if len(attackers) > len(defenders):
                        logger.info(
                            f"⭐ REAL SACRIFICE PATTERN: {piece.symbol()}({piece_value}) x "
                            f"{captured_piece.symbol()}({captured_value}) can be recaptured. "
                            f"Net loss: {net_material_loss} material. "
                            f"Attackers: {len(attackers)}, Defenders: {len(defenders)}. "
                            f"Eval: {eval_before} → {eval_after} (diff: {eval_diff_cp}cp)"
                        )
                        return f"Tactical sacrifice: losing {net_material_loss} material for attack"
    
    # === PATTERN 2: HANGING PIECE SACRIFICE (non-capture to attacked square) ===
    if not is_capture:
        # Check if destination square is attacked by opponent
        is_attacked = board_after.is_attacked_by(not board.turn, move.to_square)
        
        if is_attacked:
            # Count attackers and defenders
            attackers = list(board_after.attackers(not board.turn, move.to_square))
            defenders = list(board_after.attackers(board.turn, move.to_square))
            
            # If more attackers than defenders, piece is hanging (can be captured)
            if len(attackers) > len(defenders):
                logger.info(
                    f"⭐ HANGING PIECE PATTERN: {piece.symbol()} to {chess.square_name(move.to_square)}. "
                    f"Attackers: {len(attackers)}, Defenders: {len(defenders)}. "
                    f"Risking {piece_value} material. "
                    f"Eval: {eval_before} → {eval_after} (diff: {eval_diff_cp}cp)"
                )
                return f"Bold piece placement on attacked square (risking {piece_value} material)"
    
    # No brilliant pattern detected
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
        # Check for brilliant first
        if board:
            brilliant_type = _check_brilliant_patterns(
                played_move, board, eval_before, eval_after, diff_cp
            )
            if brilliant_type and diff_cp <= 50:
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