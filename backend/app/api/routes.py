"""API route handlers."""

import uuid
from fastapi import APIRouter, BackgroundTasks, WebSocket, HTTPException
from ..models.schemas import (
    AnalysisRequest, AnalysisStartResponse, GameAnalysisResult, HealthResponse
)
from ..utils.pgn import parse_pgn, validate_pgn_length
from ..engine.analyzer import analyze_game, get_analysis_result
from ..engine.stockfish import StockfishEngine
from ..ws.manager import WSManager
from ..utils.logging import logger
from ..config import settings

router = APIRouter()
ws_manager = WSManager()


@router.post("/api/analyze", response_model=AnalysisStartResponse)
async def analyze_endpoint(
    request: AnalysisRequest,
    background_tasks: BackgroundTasks
):
    """
    Start game analysis.
    
    Accepts PGN and initiates background analysis task.
    """
    try:
        # Validate PGN length
        validate_pgn_length(request.pgn, settings.MAX_PGN_LENGTH)
        
        # Parse PGN
        moves, headers = parse_pgn(request.pgn)
        
        # Generate task ID
        task_id = str(uuid.uuid4())
        
        logger.info(
            f"Received analyze request: task_id={task_id} moves={len(moves)} "
            f"depth={request.engine_depth}"
        )
        
        # Schedule background analysis
        background_tasks.add_task(
            analyze_game,
            task_id=task_id,
            moves=moves,
            headers=headers,
            depth=request.engine_depth,
            time_per_move_ms=request.time_per_move_ms,
            ws_manager=ws_manager
        )
        
        return AnalysisStartResponse(
            task_id=task_id,
            status="started",
            total_moves=len(moves)
        )
        
    except ValueError as e:
        logger.error(f"PGN validation error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Analysis request failed: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/api/game/{task_id}", response_model=GameAnalysisResult)
async def get_game_endpoint(task_id: str):
    """
    Retrieve complete game analysis result.
    
    Returns cached analysis for the given task ID.
    """
    logger.info(f"Fetching complete analysis: task_id={task_id}")
    
    result = get_analysis_result(task_id)
    
    if result is None:
        logger.warning(f"Analysis not found for task_id={task_id}")
        raise HTTPException(status_code=404, detail="Analysis not found or still in progress")
    
    return result


@router.websocket("/ws/analyze/{task_id}")
async def websocket_endpoint(websocket: WebSocket, task_id: str):
    """
    WebSocket endpoint for real-time analysis updates.
    
    Clients connect to receive streaming analysis updates.
    """
    await ws_manager.connect(task_id, websocket)
    try:
        await ws_manager.listen(task_id, websocket)
    except Exception as e:
        logger.error(f"WebSocket error for task_id={task_id}: {str(e)}")
    finally:
        ws_manager.disconnect(task_id, websocket)


@router.get("/api/health", response_model=HealthResponse)
async def health_endpoint():
    """
    Health check endpoint.
    
    Verifies that the API and Stockfish engine are operational.
    """
    try:
        engine = StockfishEngine()
        is_available = engine.is_available()
        
        if is_available:
            logger.info("Health check: OK")
            return HealthResponse(
                status="healthy",
                engine_available=True,
                message="Engine is operational"
            )
        else:
            logger.warning("Health check: Engine unavailable")
            return HealthResponse(
                status="unhealthy",
                engine_available=False,
                message="Engine is not responding"
            )
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        return HealthResponse(
            status="unhealthy",
            engine_available=False,
            message=f"Engine error: {str(e)}"
        )
