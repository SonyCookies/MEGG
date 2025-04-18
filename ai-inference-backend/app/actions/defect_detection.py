import logging
from app.utils.image_processing import predict_defect

logger = logging.getLogger(__name__)

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