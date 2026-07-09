import asyncio
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import json
import random
from typing import Dict, List

router = APIRouter()

# Store active connections
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, device_id: str):
        await websocket.accept()
        if device_id not in self.active_connections:
            self.active_connections[device_id] = []
        self.active_connections[device_id].append(websocket)
        print(f"Device {device_id} connected via WebSocket")

    def disconnect(self, websocket: WebSocket, device_id: str):
        if device_id in self.active_connections:
            self.active_connections[device_id].remove(websocket)
            if not self.active_connections[device_id]:
                del self.active_connections[device_id]
        print(f"Device {device_id} disconnected")

    async def broadcast(self, device_id: str, message: dict):
        if device_id in self.active_connections:
            dead_connections = []
            for connection in self.active_connections[device_id]:
                try:
                    await connection.send_text(json.dumps(message))
                except Exception:
                    dead_connections.append(connection)
            
            for dead in dead_connections:
                self.disconnect(dead, device_id)

manager = ConnectionManager()

@router.websocket("/ws/telemetry/{device_id}")
async def websocket_endpoint(websocket: WebSocket, device_id: str):
    await manager.connect(websocket, device_id)
    try:
        # Simulate IoT Hardware streaming data every 2 seconds
        # In a real app, this data would come from MQTT or Redis Pub/Sub
        temp = 24.5
        humid = 45.0
        while True:
            await asyncio.sleep(2)
            
            # Simulate slight environmental changes
            temp += random.uniform(-0.5, 0.5)
            humid += random.uniform(-1.0, 1.0)
            
            payload = {
                "deviceId": device_id,
                "timestamp": asyncio.get_event_loop().time(),
                "temperature": round(temp, 1),
                "humidity": round(humid, 1),
                "status": "online",
                "networkStrength": random.randint(70, 100),
                "cpuUsage": random.randint(10, 80)
            }
            
            await manager.broadcast(device_id, payload)
            
    except WebSocketDisconnect:
        manager.disconnect(websocket, device_id)
