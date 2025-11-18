"""Logging configuration for HoneyPotEngine."""

import sys
from loguru import logger

# Configure logger
logger.remove()  # Remove default handler
logger.add(
    sys.stdout,
    format="[{time:YYYY-MM-DD HH:mm:ss}] {level} {name} :: {message}",
    level="INFO"
)

__all__ = ["logger"]
