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
    if board:
        board_after = board.copy()
        board_after.push(played_move)
        if board_after.is_checkmate():
            logger.info(f"Checkmate detected: {played_move} - classifying as 'best'")
            return "best"
        
        # Check if move allows forced checkmate for opponent
        if _allows_forced_checkmate(board_after):
            logger.info(f"Move allows forced checkmate: {played_move} - classifying as 'blunder'")
            return "blunder"
    
    played_move_uci = played_move.uci()
    is_best_move = (played_move_uci == best_move)
    
    best_win_pct = compute_win_probability(best_eval_cp) * 100
    played_win_pct = compute_win_probability(played_eval_cp) * 100
    
    win_loss_pct = best_win_pct - played_win_pct
    
    is_garbage_time = abs(best_eval_cp) > 700
    
    if is_opening and is_best_move:
        return "theory"
    
    # If the played move is the best move, it must be classified as brilliant/best/great
    if board and is_best_move and not is_garbage_time:
        if _is_brilliant_candidate(
            played_move, board, best_eval_cp, played_eval_cp, 0
        ):
            logger.info(f"Brilliant move detected: {played_move} with eval swing")
            return "brilliant"
        # Top engine move without sacrifice: best or great
        # Use stricter criteria for "best" - very minimal win% loss
        if win_loss_pct <= 0.5:
            return "best"
        else:
            return "great"
    
    if is_garbage_time:
        if is_best_move:
            return "best"
        elif win_loss_pct <= 2.0:
            return "best"
        else:
            return "excellent"
    
    # For non-best moves, use the standard classification
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
    if board:
        board_after = board.copy()
        board_after.push(played_move)
        
        if board_after.is_checkmate():
            logger.info(f"Checkmate detected: {played_move} - classifying as 'best'")
            return "best"
        
        # Check if move allows forced checkmate for opponent
        if _allows_forced_checkmate(board_after):
            logger.info(f"Move allows forced checkmate: {played_move} - classifying as 'blunder'")
            return "blunder"
    
    played_move_uci = played_move.uci()
    is_best_move = (played_move_uci == best_move)
    
    if is_opening and is_best_move:
        return "theory"
    
    # If the played move is the best move, it must be classified as brilliant/best/great
    if board and is_best_move:
        if _is_brilliant_candidate(
            played_move, board, eval_before, eval_after, diff_cp
        ):
            logger.info(f"Brilliant move detected: {played_move} with eval swing")
            return "brilliant"
        # Top engine move without sacrifice: best or great
        # Use stricter criteria for "best" - minimal cp loss
        if diff_cp <= 5:
            return "best"
        else:
            return "great"
    
    # For non-best moves, use the standard classification
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


def _is_brilliant_candidate(
    move: chess.Move,
    board: chess.Board,
    eval_before: int,
    eval_after: int,
    diff_cp: int
) -> bool:
    if diff_cp > 0:
        return False
    
    piece = board.piece_at(move.from_square)
    if piece is None:
        return False
    
    has_sacrifice = False
    is_capture = board.is_capture(move)
    piece_value = _get_piece_value(piece.piece_type)
    
    if is_capture:
        captured_piece = board.piece_at(move.to_square)
        if captured_piece:
            captured_value = _get_piece_value(captured_piece.piece_type)
            if piece_value > captured_value:
                has_sacrifice = True
                logger.info(
                    f"Sacrifice detected: {piece.symbol()}({piece_value}) x "
                    f"{captured_piece.symbol()}({captured_value}) = "
                    f"-{piece_value - captured_value} material"
                )
    else:
        board_after = board.copy()
        board_after.push(move)
        
        if board_after.is_attacked_by(not board.turn, move.to_square):
            attackers = len(board_after.attackers(not board.turn, move.to_square))
            defenders = len(board_after.attackers(board.turn, move.to_square))
            
            if attackers > defenders:
                has_sacrifice = True
                logger.info(f"Piece sacrifice: {piece.symbol()} left hanging at {chess.square_name(move.to_square)}")
    
    if has_sacrifice:
        return True
    
    return False


def _get_piece_value(piece_type: int) -> int:
    values = {
        chess.PAWN: 1,
        chess.KNIGHT: 3,
        chess.BISHOP: 3,
        chess.ROOK: 5,
        chess.QUEEN: 9,
        chess.KING: 0
    }
    return values.get(piece_type, 0)


def _allows_forced_checkmate(board: chess.Board) -> bool:
    """
    Check if the position allows opponent to deliver checkmate in 1 or 2 moves.
    This is a heuristic check - does not use full search.
    """
    if board.is_checkmate():
        return False  # Already checkmate
    
    # Check for mate in 1 for opponent
    for move in board.legal_moves:
        test_board = board.copy()
        test_board.push(move)
        if test_board.is_checkmate():
            logger.info(f"Opponent has mate in 1: {move}")
            return True
    
    # Check for mate in 2 (opponent's forced sequence)
    # This is expensive, so we limit it to promising positions
    if board.is_check():
        # If in check, only a few moves available - check mate in 2
        for move in board.legal_moves:
            test_board = board.copy()
            test_board.push(move)
            
            # Check if opponent now has mate in 1
            for opp_move in test_board.legal_moves:
                test_board2 = test_board.copy()
                test_board2.push(opp_move)
                if test_board2.is_checkmate():
                    logger.info(f"Opponent has forced mate in 2: {move} -> {opp_move}")
                    return True
    
    return False


def calculate_accuracy(centipawn_losses: list[int], k_factor: int = None) -> float:
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
    import math
    clamped_cp = max(-10000, min(10000, cp))
    win_pct = 50 + 50 * (2 / (1 + math.exp(-0.004 * clamped_cp)) - 1)
    return round(win_pct / 100, 3)
