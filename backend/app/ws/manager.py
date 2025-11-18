"""WebSocket connection manager."""

from fastapi import WebSocket
from typing import Dict, List
import json
from ..utils.logging import logger


class WSManager:
    """Manage WebSocket connections for real-time analysis updates."""
    
    def __init__(self):
        # Map task_id -> list of active connections
        self.active_connections: Dict[str, List[WebSocket]] = {}
    
    async def connect(self, task_id: str, websocket: WebSocket):
        """Accept and store a new WebSocket connection."""
        await websocket.accept()
        if task_id not in self.active_connections:
            self.active_connections[task_id] = []
        self.active_connections[task_id].append(websocket)
        logger.info(f"WebSocket connected for task_id={task_id}")
    
    def disconnect(self, task_id: str, websocket: WebSocket):
        """Remove a WebSocket connection."""
        if task_id in self.active_connections:
            if websocket in self.active_connections[task_id]:
                self.active_connections[task_id].remove(websocket)
            if not self.active_connections[task_id]:
                del self.active_connections[task_id]
        logger.info(f"WebSocket disconnected for task_id={task_id}")
    
    async def broadcast(self, task_id: str, message: dict):
        """Broadcast a message to all connections for a task."""
        if task_id not in self.active_connections:
            return
        
        disconnected = []
        for connection in self.active_connections[task_id]:
            try:
                await connection.send_json(message)
            except Exception as e:
                logger.error(f"Error sending to WebSocket: {str(e)}")
                disconnected.append(connection)
        
        # Clean up disconnected clients
        for connection in disconnected:
            self.disconnect(task_id, connection)
    
    async def listen(self, task_id: str, websocket: WebSocket):
        """Keep connection alive and listen for client messages."""
        try:
            while True:
                # Just keep connection alive; client doesn't need to send anything
                data = await websocket.receive_text()
                # Echo back or ignore
        except Exception as e:
            logger.info(f"WebSocket connection closed for task_id={task_id}: {str(e)}")
