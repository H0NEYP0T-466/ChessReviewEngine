"""Stockfish engine wrapper and utilities."""

import chess
from stockfish import Stockfish
from typing import Optional, Dict, Any
from ..config import settings
from ..utils.logging import logger


class StockfishEngine:
    """Wrapper for Stockfish engine."""
    
    def __init__(
        self,
        path: Optional[str] = None,
        depth: Optional[int] = None,
        threads: Optional[int] = None,
        hash_mb: Optional[int] = None
    ):
        """
        Initialize Stockfish engine.
        
        Args:
            path: Path to stockfish binary
            depth: Search depth
            threads: Number of threads
            hash_mb: Hash table size in MB
        """
        self.path = path or settings.STOCKFISH_PATH
        self.depth = depth or settings.ENGINE_DEPTH
        self.threads = threads or settings.ENGINE_THREADS
        self.hash_mb = hash_mb or settings.ENGINE_HASH_MB
        
        logger.info(f"Initializing Stockfish: path={self.path}, depth={self.depth}, "
                   f"threads={self.threads}, hash={self.hash_mb}MB")
        
        try:
            self.engine = Stockfish(
                path=self.path,
                depth=self.depth,
                parameters={
                    "Threads": self.threads,
                    "Hash": self.hash_mb,
                }
            )
            logger.info("Stockfish engine initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize Stockfish: {str(e)}")
            raise RuntimeError(f"Could not initialize Stockfish engine: {str(e)}")
    
    def get_evaluation(self, fen: str) -> Dict[str, Any]:
        """
        Get position evaluation.
        
        Args:
            fen: FEN position string
            
        Returns:
            Dict with 'type' ('cp' or 'mate') and 'value' (int)
        """
        try:
            self.engine.set_fen_position(fen)
            eval_result = self.engine.get_evaluation()
            return eval_result
        except Exception as e:
            logger.error(f"Evaluation failed for FEN {fen}: {str(e)}")
            return {"type": "cp", "value": 0}
    
    def get_best_move(self, fen: str) -> Optional[str]:
        """
        Get best move in UCI format.
        
        Args:
            fen: FEN position string
            
        Returns:
            Best move in UCI format (e.g., 'e2e4') or None
        """
        try:
            self.engine.set_fen_position(fen)
            best_move = self.engine.get_best_move()
            return best_move
        except Exception as e:
            logger.error(f"Get best move failed for FEN {fen}: {str(e)}")
            return None
    
    def is_available(self) -> bool:
        """Check if engine is available and working."""
        try:
            self.engine.set_fen_position(chess.STARTING_FEN)
            self.engine.get_best_move()
            return True
        except Exception:
            return False


def convert_mate_to_cp(eval_dict: Dict[str, Any]) -> int:
    """
    Convert mate evaluation to centipawn equivalent.
    
    Args:
        eval_dict: Evaluation dict from engine
        
    Returns:
        Centipawn value
    """
    if eval_dict["type"] == "mate":
        mate_in = eval_dict["value"]
        # Positive mate_in means white mates, negative means black mates
        # Convert to very large cp value
        if mate_in > 0:
            return 10000 - (mate_in * 10)
        else:
            return -10000 - (mate_in * 10)
    else:
        return eval_dict["value"]


def get_cp_evaluation(engine: StockfishEngine, fen: str, perspective_white: bool = True) -> int:
    """
    Get centipawn evaluation from perspective.
    
    Args:
        engine: Stockfish engine instance
        fen: FEN position
        perspective_white: If True, positive values favor white
        
    Returns:
        Centipawn evaluation
    """
    eval_dict = engine.get_evaluation(fen)
    cp = convert_mate_to_cp(eval_dict)
    
    # Stockfish returns values from white's perspective
    # If we need black's perspective, negate
    if not perspective_white:
        cp = -cp
    
    return cp
