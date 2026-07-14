from pydantic import BaseModel

class PartGenRequest(BaseModel):
    part_name: str
