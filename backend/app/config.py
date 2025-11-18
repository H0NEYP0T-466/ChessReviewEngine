"""Configuration settings for HoneyPotEngine."""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings."""
    
    # Engine settings
    STOCKFISH_PATH: str = "/usr/games/stockfish"
    ENGINE_DEPTH: int = 18
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
