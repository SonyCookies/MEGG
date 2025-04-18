# D:\4THYEAR\CAPSTONE\MEGG\ai-inference-backend\app\websocket\websocket_server.py

from fastapi import WebSocket
import json
import logging
from app.core.config import ACTIONS

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def websocket_endpoint(websocket:WebSocket):
  await websocket.accept()
  logger.info("Websocket connection accepted")

  while True:
    try:
      data = await websocket.receive_text()
      try:
        message = json.loads(data)
        if not isinstance(message, dict):
          raise ValueError("Received JSON is not dictionary")
      except json.JSONDecodeError:
        logger.error("Invalid JSON format received")
        await websocket.send_text(json.dumps({"error": "Invalid JSON format received"}))
        continue
      except ValueError as ve:
        logger.error(f"Invalid message structuer: {ve}")
        await websocket.send_text(json.dumps({"error": str(ve)}))
        continue

      action = message.get("action")
      if action in ACTIONS:
        logger.info(f"Processing action: {action}")
        result = await ACTIONS[action](message)
        logger.info(f"Sending response: {result}")
        await websocket.send_text(json.dumps(result))

      else: 
        error_message = {"error": "Unknown action"}
        logger.warning(f"Unknown action received: {action}")
        await websocket.send_text(json.dumps(error_message))
    except Exception as e:
      logger.error(f"Websocket Error: {e}", exc_info=True)
      break
