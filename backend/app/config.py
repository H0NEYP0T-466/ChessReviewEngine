"""Configuration settings for HoneyPotEngine."""

import os
import platform
import shutil
from pydantic_settings import BaseSettings


def find_stockfish_path() -> str:
    """
    Automatically detect Stockfish executable path based on the operating system.
    
    Returns:
        Path to Stockfish executable, or default fallback path.
    """
    # First, check if stockfish is in PATH
    stockfish_in_path = shutil.which("stockfish")
    if stockfish_in_path:
        return stockfish_in_path
    
    # Platform-specific default paths
    system = platform.system()
    
    if system == "Windows":
        # Common Windows installation paths
        possible_paths = [
            r"C:\Program Files\Stockfish\stockfish.exe",
            r"C:\Program Files (x86)\Stockfish\stockfish.exe",
            os.path.expanduser(r"~\AppData\Local\Stockfish\stockfish.exe"),
            "stockfish.exe",
        ]
    elif system == "Darwin":  # macOS
        possible_paths = [
            "/usr/local/bin/stockfish",
            "/opt/homebrew/bin/stockfish",
            "/usr/bin/stockfish",
        ]
    else:  # Linux and others
        possible_paths = [
            "/usr/games/stockfish",
            "/usr/bin/stockfish",
            "/usr/local/bin/stockfish",
        ]
    
    # Check each possible path
    for path in possible_paths:
        if os.path.isfile(path) and os.access(path, os.X_OK):
            return path
    
    # Return a sensible default based on platform if nothing found
    if system == "Windows":
        return "stockfish.exe"
    elif system == "Darwin":
        return "/usr/local/bin/stockfish"
    else:
        return "/usr/games/stockfish"


class Settings(BaseSettings):
    """Application settings."""
    
    # Engine settings
    STOCKFISH_PATH: str = find_stockfish_path()
    ENGINE_DEPTH: int = 10
    ENGINE_THREADS: int = 4
    ENGINE_HASH_MB: int = 256
    TIME_PER_MOVE_MS: int = 300
    
    # Classification thresholds (in centipawns)
    THRESHOLD_BEST: int = 0
    THRESHOLD_EXCELLENT: int = 10
    THRESHOLD_GREAT: int = 20
    THRESHOLD_GOOD: int = 40
    THRESHOLD_MISTAKE: int = 100
    THRESHOLD_MISS: int = 200
    THRESHOLD_BLUNDER: int = 300
    THRESHOLD_BRILLIANT_IMPROVEMENT: int = 150
    
    # Accuracy calculation
    ACCURACY_K_FACTOR: int = 120
    
    # API settings
    MAX_PGN_LENGTH: int = 20000
    CORS_ORIGINS: list[str] = ["http://localhost:5173", "http://localhost:3000"]
    
    class Config:
        env_file = ".env"


settings = Settings()
