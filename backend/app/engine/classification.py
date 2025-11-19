"""Move classification logic."""

import chess
from typing import Literal
from ..config import settings
from ..utils.logging import logger


MoveClassification = Literal[
    "theory", "best", "excellent", "great", "good",
    "brilliant", "inaccuracy", "mistake", "blunder"
]


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
    # Opening theory moves - only mark as theory if it's a very good move
    if is_opening and diff_cp <= settings.THRESHOLD_BEST:
        return "theory"
    
    # Check for brilliant move - requires being essentially the best move
    # AND creating a huge advantage
    if board and diff_cp <= 10:  # Must be within 10cp of best
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
    
    According to spec, a brilliant move:
    - Gains ≥ +2.00 (200cp) advantage from an equal/close position
    - Often a tactical knockout or surprising genius move
    - Completely changes the game
    
    Args:
        move: The played move
        board: Board before the move
        eval_before: Best evaluation before move
        eval_after: Evaluation after played move
        diff_cp: CP difference between best and played (should be ~0 for brilliant)
        
    Returns:
        True if move appears brilliant
    """
    # Brilliant move must be essentially the best move (diff_cp very small)
    if diff_cp > settings.THRESHOLD_BEST:
        return False
    
    # Check if the move creates a huge advantage (≥200cp) from close position
    # eval_after is from the player's perspective after the move
    # If position was close (eval_before small) and now there's huge advantage
    if abs(eval_before) < 100:  # Position was relatively equal
        if abs(eval_after) >= settings.THRESHOLD_BRILLIANT:  # Now huge advantage
            logger.info(f"Brilliant candidate: eval_before={eval_before}, eval_after={eval_after}")
            return True
    
    # Check for tactical brilliance: sacrifice that leads to advantage
    is_capture = board.is_capture(move)
    piece = board.piece_at(move.from_square)
    if piece is None:
        return False
    
    piece_value = _get_piece_value(piece.piece_type)
    
    # Check for actual sacrifices (captures where we lose material value)
    if is_capture:
        captured_piece = board.piece_at(move.to_square)
        if captured_piece:
            captured_value = _get_piece_value(captured_piece.piece_type)
            if piece_value > captured_value + 1:  # Sacrificing more than gaining
                # If eval improves massively despite sacrifice, it's brilliant
                if abs(eval_after) >= settings.THRESHOLD_BRILLIANT:
                    return True
    
    # Check for quiet moves that create huge threats
    if not is_capture and piece_value >= 3:
        # Quiet piece move that creates ≥200cp advantage
        if abs(eval_after) >= settings.THRESHOLD_BRILLIANT:
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
    
    Uses logistic function: P = 1 / (1 + 10^(-cp/400))
    
    Args:
        cp: Centipawn evaluation
        
    Returns:
        Win probability (0.0 to 1.0)
    """
    import math
    return round(1 / (1 + math.pow(10, -cp / 400)), 3)
