# controllers/manual_control_controller.py

from fastapi import APIRouter
from services.motor_service import move_nema_motor


router = APIRouter()

@router.post("/api/move-egg")
async def move_egg_from_ai():
  result = move_nema_motor()
  return {"status": result}