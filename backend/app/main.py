"""Main FastAPI application for HoneyPotEngine."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .api.routes import router
from .config import settings
from .utils.logging import logger

# Create FastAPI app
app = FastAPI(
    title="HoneyPotEngine",
    description="Chess Game Review System - Backend API",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routes
app.include_router(router)

logger.info("HoneyPotEngine API started")


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "name": "HoneyPotEngine",
        "version": "1.0.0",
        "description": "Chess Game Review System API"
    }
