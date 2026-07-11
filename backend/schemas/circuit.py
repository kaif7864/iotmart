from pydantic import BaseModel
from typing import List, Optional, Any

class CircuitComponent(BaseModel):
    instanceId: str
    id: str
    type: str
    name: str
    x: float
    y: float
    label: str
    pins: Optional[List[Any]] = None
    pinsLeft: Optional[List[Any]] = None
    pinsRight: Optional[List[Any]] = None
    nexarData: Optional[Any] = None

class Wire(BaseModel):
    fromInstance: str
    fromPin: str
    toInstance: str
    toPin: str
    points: List[float]

class CircuitSchema(BaseModel):
    name: str
    description: Optional[str] = ""
    userId: str
    components: List[CircuitComponent]
    wires: List[Wire]
    code: Optional[str] = ""
