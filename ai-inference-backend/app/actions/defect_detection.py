#D:\4THYEAR\CAPSTONE\MEGG\ai-inference-backend\app\actions\defect_detection.py

import logging
import os
import httpx
from dotenv import load_dotenv
from app.utils.image_processing import predict_defect

load_dotenv()

logger = logging.getLogger(__name__)

IOT_BACKEND_MOVE_ENDPOINT = os.getenv("IOT_BACKEND_MOVE_ENDPOINT", "http://localhost:9000/api/move-egg")


async def handle_defect_detection(message):
  try:
    image_data = message.get('image')
    if not image_data:
      logger.error("No image data received")
      return {
        "action": "defect_detection_result",
        "error": "No image data received"
      }
    logger.info("Processing image for defect detection")
    predicted_class, confidence = predict_defect(image_data)

    #######################################
    await move_motor()
    #######################################

    return {
      "action": "defect_detection_result",
      "defects": [predicted_class],
      "confidence": confidence,
      "image": image_data
    }
  except Exception as e:
    logger.exception("Error during defect detection")
    return {
      "action": "defect_detection_result",
      "error": str(e)
    }
  

async def move_motor():
  try:
    async with httpx.AsyncClient() as client:
      response = await client.post(IOT_BACKEND_MOVE_ENDPOINT)
      response.raise_for_status()
      logger.info(f"Motor moved successfully: {response.json()}")
  except httpx.HTTPError as e:
    logger.error(f"Failed to trigger motor: {e}")


