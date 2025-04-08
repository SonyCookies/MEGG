from fastapi import FastAPI
from pydantic import BaseModel

class MotorCommand(BaseModel):
    result: str
    confidence: float

app = FastAPI()

@app.get("/")
async def root():
    return {"message": "IoT Backend is running"}


@app.post("/rotate")
async def rotate_motor(cmd: MotorCommand):

    
    return {"status" : "motor command sent"}