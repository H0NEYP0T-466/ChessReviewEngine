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
        depth: Optional[int] = 5,
        threads: Optional[int] = 4,
        hash_mb: Optional[int] = 256,
    ):
        """
        Initialize Stockfish engine.
        
        Args:
            path: Path to stockfish binary (uses auto-detection if None)
            depth: Search depth
            threads: Number of threads
            hash_mb: Hash table size in MB
        """
        self.path = path if path is not None else settings.STOCKFISH_PATH
        self.depth = depth
        self.threads = threads or settings.ENGINE_THREADS
        self.hash_mb = hash_mb or settings.ENGINE_HASH_MB
        
        logger.info(
            f"Initializing Stockfish: path={self.path}, depth={self.depth}, "
            f"threads={self.threads}, hash={self.hash_mb}MB"
        )
        
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
        except FileNotFoundError as e:
            logger.error(f"Stockfish executable not found at: {self.path}")
            error_msg = (
                f"Stockfish executable not found at path: {self.path}\n"
                f"Please install Stockfish or set the correct path via STOCKFISH_PATH environment variable.\n"
                f"Installation instructions:\n"
                f"  - Windows: Download from stockfishchess.org and extract to a known location\n"
                f"  - Linux: sudo apt-get install stockfish\n"
                f"  - macOS: brew install stockfish"
            )
            raise RuntimeError(error_msg) from e
        except Exception as e:
            logger.error(f"Failed to initialize Stockfish: {str(e)}")
            raise RuntimeError(f"Could not initialize Stockfish engine: {str(e)}") from e
    
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
            return self.engine.get_evaluation()
        except Exception as e:
            logger.error(f"Evaluation failed for FEN {fen}: {str(e)}")
            return {"type": "cp", "value": 0}
    
    def get_best_move(self, fen: str) -> Optional[str]:
        """
        Get best move in UCI format.
        
        Args:
            fen: FEN position string
            
        Returns:
            Best move or None
        """
        try:
            self.engine.set_fen_position(fen)
            return self.engine.get_best_move()
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
    Convert mate eval to centipawn-like score.
    """
    if eval_dict["type"] == "mate":
        mate_in = eval_dict["value"]
        if mate_in > 0:
            return 10000 - (mate_in * 10)
        else:
            return -10000 - (mate_in * 10)
    return eval_dict["value"]


def get_cp_evaluation(engine: StockfishEngine, fen: str, perspective_white: bool = True) -> int:
    """
    Get centipawn evaluation from chosen perspective.
    """
    eval_dict = engine.get_evaluation(fen)
    cp = convert_mate_to_cp(eval_dict)
    
    if not perspective_white:
        cp = -cp
    
    return cp
