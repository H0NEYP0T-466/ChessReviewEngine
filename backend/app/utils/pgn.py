"""PGN parsing utilities."""

import io
import chess.pgn
from typing import Tuple
from ..utils.logging import logger


def parse_pgn(pgn_string: str) -> Tuple[list[chess.Move], dict[str, str]]:
    """
    Parse a PGN string and extract moves and headers.
    
    Args:
        pgn_string: PGN formatted string
        
    Returns:
        Tuple of (list of moves, headers dict)
        
    Raises:
        ValueError: If PGN is invalid or cannot be parsed
    """
    logger.info("Starting PGN parsing")
    
    try:
        pgn_io = io.StringIO(pgn_string)
        game = chess.pgn.read_game(pgn_io)
        
        if game is None:
            raise ValueError("Could not parse PGN - game is None")
        
        # Extract headers
        headers = dict(game.headers)
        logger.info(f"Parsed headers: Event={headers.get('Event', 'N/A')}, "
                   f"White={headers.get('White', 'N/A')}, "
                   f"Black={headers.get('Black', 'N/A')}")
        
        # Extract moves
        moves = []
        board = game.board()
        for move in game.mainline_moves():
            if not board.is_legal(move):
                raise ValueError(f"Illegal move found: {move}")
            moves.append(move)
            board.push(move)
        
        logger.info(f"Successfully parsed PGN with {len(moves)} moves")
        
        if len(moves) == 0:
            raise ValueError("PGN contains no moves")
        
        return moves, headers
        
    except Exception as e:
        logger.error(f"PGN parsing failed: {str(e)}")
        raise ValueError(f"Invalid PGN: {str(e)}")


def validate_pgn_length(pgn_string: str, max_length: int = 20000) -> None:
    """
    Validate PGN string length.
    
    Args:
        pgn_string: PGN string to validate
        max_length: Maximum allowed length
        
    Raises:
        ValueError: If PGN exceeds max length
    """
    if len(pgn_string) > max_length:
        raise ValueError(f"PGN too long: {len(pgn_string)} chars (max {max_length})")
