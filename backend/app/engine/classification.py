"""Move classification logic."""

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
    Classify move based on win probability loss (more accurate than centipawn loss).
    
    Args:
        best_eval_cp: Evaluation if best move was played (from player's perspective)
        played_eval_cp: Evaluation after played move (from player's perspective)
        played_move: The move that was played
        best_move: Best move in UCI format
        is_opening: Whether move is in opening theory
        board: Current board position (optional, for brilliant detection)
        player_turn_white: True if it's white's turn, False if black's
        
    Returns:
        Move classification
    """
    # Check for checkmate first - winning checkmate is always "best"
    if board:
        board_after = board.copy()
        board_after.push(played_move)
        if board_after.is_checkmate():
            logger.info(f"Checkmate detected: {played_move} - classifying as 'best'")
            return "best"
    
    # Compare played move with best move properly (UCI format)
    played_move_uci = played_move.uci()
    is_best_move = (played_move_uci == best_move)
    
    # Calculate win% for best move and played move (both from player's perspective)
    best_win_pct = compute_win_probability(best_eval_cp) * 100
    played_win_pct = compute_win_probability(played_eval_cp) * 100
    
    # Win% loss (always positive, higher = worse)
    win_loss_pct = best_win_pct - played_win_pct
    
    # Check if position is "garbage time" (already completely winning/losing)
    # Winning = eval > 700cp from player's perspective
    is_garbage_time = abs(best_eval_cp) > 700
    
    # Opening theory moves - only mark as theory if it's a very good move
    if is_opening and win_loss_pct <= 2.0:  # Less than 2% win probability loss
        return "theory"
    
    # Check for brilliant move - requires being the best move AND meeting criteria
    # Skip in garbage time
    if board and is_best_move and not is_garbage_time:
        if _is_brilliant_candidate(
            played_move, board, best_eval_cp, played_eval_cp, 0
        ):
            logger.info(f"Brilliant move detected: {played_move} with eval swing")
            return "brilliant"
    
    # In garbage time, only allow "best" or "excellent"
    if is_garbage_time:
        if win_loss_pct <= 2.0:
            return "best"
        else:
            return "excellent"
    
    # Standard win% based classification
    # Best: 0-1% win loss
    # Excellent: 1-2% win loss  
    # Great: 2-5% win loss
    # Good: 5-10% win loss
    # Inaccuracy: 10-20% win loss
    # Mistake: 20-30% win loss
    # Blunder: >30% win loss
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
    Classify a move based on centipawn loss and context.
    
    Classification thresholds (diff_cp is centipawn LOSS vs best move):
    - Brilliant: Special case - best move creating ≥200cp advantage
    - Best: 0-20cp loss (includes excellent moves in spec)
    - Good: 20-50cp loss  
    - Inaccuracy: 50-100cp loss (was called "great" or "mistake" range in old spec)
    - Mistake: 100cp+ loss
    - Blunder: 100cp+ loss (same as mistake for now, can be separated by context)
    
    Note: The spec mentions "Good: +0.20 to +0.50" meaning moves that improve 
    position by 0.2-0.5 vs baseline. In practice, we classify based on how much 
    WORSE than the best move, so:
    - 0-20cp worse than best = Best/Excellent
    - 20-50cp worse = Good
    - 50-100cp worse = Inaccuracy  
    - 100cp+ worse = Mistake/Blunder
    
    Args:
        diff_cp: Absolute centipawn difference between best and played move (positive = loss)
        played_move: The move that was played
        best_move: Best move in UCI format
        is_opening: Whether move is in opening theory
        board: Current board position (optional, for brilliant detection)
        eval_before: Evaluation before move
        eval_after: Evaluation after move
        
    Returns:
        Move classification
    """
    # FIX 1: Check for checkmate first - winning checkmate is always "best"
    if board:
        # Create a temporary board to check the position after the move
        board_after = board.copy()
        board_after.push(played_move)
        
        # If the move results in checkmate for the current player, it's the best move
        if board_after.is_checkmate():
            logger.info(f"Checkmate detected: {played_move} - classifying as 'best'")
            return "best"
    
    # FIX 2: Compare played move with best move properly (UCI format)
    # Convert both to UCI strings for comparison
    played_move_uci = played_move.uci()
    is_best_move = (played_move_uci == best_move)
    
    # Opening theory moves - only mark as theory if it's a very good move
    if is_opening and diff_cp <= settings.THRESHOLD_BEST:
        return "theory"
    
    # FIX 3: Check for brilliant move - requires being the best move AND meeting criteria
    if board and is_best_move:  # Must be the exact best move
        if _is_brilliant_candidate(
            played_move, board, eval_before, eval_after, diff_cp
        ):
            logger.info(f"Brilliant move detected: {played_move} with eval swing")
            return "brilliant"
    
    # Standard classifications based on centipawn loss vs best move
    # According to refined spec:
    # 0-10cp = best, 10-20cp = excellent, 20-50cp = great, 50-100cp = good
    # 100-200cp = inaccuracy, 200-300cp = mistake, 300cp+ = blunder
    if diff_cp <= settings.THRESHOLD_BEST:  # 0-10cp loss
        return "best"
    elif diff_cp <= settings.THRESHOLD_EXCELLENT:  # 10-20cp loss
        return "excellent"
    elif diff_cp <= settings.THRESHOLD_GREAT:  # 20-50cp loss
        return "great"
    elif diff_cp <= settings.THRESHOLD_GOOD:  # 50-100cp loss
        return "good"
    elif diff_cp <= settings.THRESHOLD_INACCURACY:  # 100-200cp loss
        return "inaccuracy"
    elif diff_cp <= settings.THRESHOLD_MISTAKE:  # 200-300cp loss
        return "mistake"
    else:  # >= 300cp loss
        return "blunder"


def _is_brilliant_candidate(
    move: chess.Move,
    board: chess.Board,
    eval_before: int,
    eval_after: int,
    diff_cp: int
) -> bool:
    """
    Detect if a move is brilliant.
    
    According to refined spec, a brilliant move:
    - Must be the engine's top move (checked by caller)
    - Must involve a sacrifice: material value decreases after the move
    - Gains ≥ +2.00 (200cp) advantage
    - Often a tactical knockout or surprising genius move
    
    Args:
        move: The played move (must be the best move - verified by caller)
        board: Board before the move
        eval_before: Best evaluation before move
        eval_after: Evaluation after played move
        diff_cp: CP difference between best and played (should be 0 for brilliant)
        
    Returns:
        True if move appears brilliant
    """
    # Brilliant move must be essentially the best move (diff_cp = 0)
    if diff_cp > 0:
        return False
    
    # Calculate material before and after move to detect sacrifice
    piece = board.piece_at(move.from_square)
    if piece is None:
        return False
    
    # Check if move involves sacrifice
    has_sacrifice = False
    is_capture = board.is_capture(move)
    piece_value = _get_piece_value(piece.piece_type)
    
    if is_capture:
        # For captures, check if we're sacrificing material
        captured_piece = board.piece_at(move.to_square)
        if captured_piece:
            captured_value = _get_piece_value(captured_piece.piece_type)
            # Sacrifice means giving up more valuable piece for less valuable one
            # e.g., Queen (9) takes Pawn (1) = sacrifice of 8 points
            if piece_value > captured_value + 1:  # Real sacrifice (not equal trade)
                has_sacrifice = True
                logger.info(
                    f"Sacrifice detected: {piece.symbol()}({piece_value}) x "
                    f"{captured_piece.symbol()}({captured_value}) = "
                    f"-{piece_value - captured_value} material"
                )
    else:
        # For non-captures, check if we're offering/leaving material hanging
        # Create temporary board to see if piece is now attacked
        board_after = board.copy()
        board_after.push(move)
        
        # Check if the moved piece is now attacked and not defended
        if board_after.is_attacked_by(not board.turn, move.to_square):
            # Piece is attacked - check if it's defended
            attackers = len(board_after.attackers(not board.turn, move.to_square))
            defenders = len(board_after.attackers(board.turn, move.to_square))
            
            if attackers > defenders:
                # Piece is hanging - could be a sacrifice
                has_sacrifice = True
                logger.info(f"Piece sacrifice: {piece.symbol()} left hanging at {chess.square_name(move.to_square)}")
    
    # Brilliant requires sacrifice AND huge evaluation improvement
    if has_sacrifice:
        # Check if the move creates a huge advantage (≥200cp)
        # Position before should be close or losing, after should be winning
        if abs(eval_after) >= settings.THRESHOLD_BRILLIANT:
            # Also check that it's a significant improvement
            improvement = abs(eval_after) - abs(eval_before)
            if improvement >= settings.THRESHOLD_BRILLIANT // 2:  # At least 100cp improvement
                logger.info(
                    f"Brilliant move confirmed: sacrifice with eval swing "
                    f"{eval_before} -> {eval_after} (improvement: +{improvement}cp)"
                )
                return True
    
    return False


def _get_piece_value(piece_type: int) -> int:
    """Get standard piece value."""
    values = {
        chess.PAWN: 1,
        chess.KNIGHT: 3,
        chess.BISHOP: 3,
        chess.ROOK: 5,
        chess.QUEEN: 9,
        chess.KING: 0
    }
    return values.get(piece_type, 0)


def calculate_accuracy(centipawn_losses: list[int], k_factor: int = None) -> float:
    """
    Calculate accuracy from centipawn losses.
    
    Uses exponential decay: accuracy = 100 * exp(-CPL / K)
    
    Args:
        centipawn_losses: List of CP losses for each move
        k_factor: K factor for accuracy calculation
        
    Returns:
        Accuracy percentage (0-100)
    """
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
    """
    Convert centipawn evaluation to win probability.
    
    Uses improved formula: Win% = 50 + 50 * (2 / (1 + exp(-0.004 * cp)) - 1)
    This matches Chess.com/Lichess formula for better accuracy.
    
    Args:
        cp: Centipawn evaluation (from player's perspective, positive = advantage)
        
    Returns:
        Win probability (0.0 to 1.0)
    """
    import math
    # Clamp extreme values to avoid overflow
    clamped_cp = max(-10000, min(10000, cp))
    win_pct = 50 + 50 * (2 / (1 + math.exp(-0.004 * clamped_cp)) - 1)
    return round(win_pct / 100, 3)
