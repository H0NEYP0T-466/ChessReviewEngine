"""Move classification logic."""

import chess
from typing import Literal
from ..config import settings
from ..utils.logging import logger


MoveClassification = Literal[
    "theory", "best", "excellent", "great", "good",
    "brilliant", "mistake", "miss", "blunder"
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
    
    Args:
        diff_cp: Absolute centipawn difference between best and played move
        played_move: The move that was played
        best_move: Best move in UCI format
        is_opening: Whether move is in opening theory
        board: Current board position (optional, for brilliant detection)
        eval_before: Evaluation before move
        eval_after: Evaluation after move
        
    Returns:
        Move classification
    """
    # Opening theory moves
    if is_opening and diff_cp <= settings.THRESHOLD_GOOD:
        return "theory"
    
    # Check for brilliant move (sacrifice leading to advantage)
    if board and _is_brilliant_candidate(
        played_move, board, eval_before, eval_after, diff_cp
    ):
        logger.info(f"Brilliant move detected: {played_move} with eval swing")
        return "brilliant"
    
    # Standard classifications based on centipawn loss
    if diff_cp <= settings.THRESHOLD_BEST:
        return "best"
    elif diff_cp <= settings.THRESHOLD_EXCELLENT:
        return "excellent"
    elif diff_cp <= settings.THRESHOLD_GREAT:
        return "great"
    elif diff_cp <= settings.THRESHOLD_GOOD:
        return "good"
    elif diff_cp < settings.THRESHOLD_MISS:
        return "mistake"
    elif diff_cp < settings.THRESHOLD_BLUNDER:
        return "miss"
    else:
        return "blunder"


def _is_brilliant_candidate(
    move: chess.Move,
    board: chess.Board,
    eval_before: int,
    eval_after: int,
    diff_cp: int
) -> bool:
    """
    Detect if a move is a brilliant sacrifice.
    
    A brilliant move is typically:
    - A sacrifice (giving up material)
    - Initially looks worse but leads to long-term advantage
    - Not immediately obvious
    
    Args:
        move: The played move
        board: Board before the move
        eval_before: Evaluation before move
        eval_after: Evaluation after move
        diff_cp: CP difference
        
    Returns:
        True if move appears brilliant
    """
    # For now, simplified brilliant detection:
    # - Move loses material (is a sacrifice)
    # - But evaluation doesn't drop too much (still good despite material loss)
    
    # Check if it's a capture or not
    is_capture = board.is_capture(move)
    
    # Get piece values
    piece = board.piece_at(move.from_square)
    if piece is None:
        return False
    
    piece_value = _get_piece_value(piece.piece_type)
    
    # If it's a non-capture of a valuable piece in a good position
    # and the move is still within reasonable bounds
    if not is_capture and piece_value >= 3 and diff_cp <= settings.THRESHOLD_GREAT:
        # Check if it creates threats (simplified: eval stays good)
        if abs(eval_after) > 50:  # Position has some tension
            return True
    
    # Check for actual sacrifices (captures where we lose material value)
    if is_capture:
        captured_piece = board.piece_at(move.to_square)
        if captured_piece:
            captured_value = _get_piece_value(captured_piece.piece_type)
            if piece_value > captured_value + 1:  # Sacrificing more than gaining
                # If eval stays reasonable despite sacrifice, could be brilliant
                if diff_cp <= settings.THRESHOLD_EXCELLENT:
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
