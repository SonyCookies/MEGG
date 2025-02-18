import logging
import traceback
import numpy as np
import cv2
import base64
import tensorflow as tf
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.config import settings
from tensorflow.keras.preprocessing.image import img_to_array
from PIL import Image

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

router = APIRouter()

IMG_WIDTH, IMG_HEIGHT = 224, 224  

def preprocess_frame(frame):
    """Convert OpenCV frame to model-compatible format"""
    img = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)  
    img = Image.fromarray(img)  
    img = img.resize((IMG_WIDTH, IMG_HEIGHT))  
    img_array = img_to_array(img)
    img_array = np.expand_dims(img_array, axis=0)  
    img_array = tf.keras.applications.resnet50.preprocess_input(img_array)  
    return img_array

@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    logger.debug("WebSocket connection attempt")
    await websocket.accept()
    logger.debug("WebSocket connection accepted")

    model = websocket.app.state.model
    if model is None:
        logger.error("Model not loaded in app state.")
        await websocket.send_json({"error": "Model not available"})
        await websocket.close()
        return

    try:
        while True:
            try:
                data = await websocket.receive_text()
                logger.debug(f"Received data length: {len(data)}")

                # Ensure correct base64 format
                if "," not in data:
                    logger.error("Invalid Base64 format received.")
                    await websocket.send_json({"error": "Invalid image format"})
                    continue
                
                img_data = base64.b64decode(data.split(',')[1])
                nparr = np.frombuffer(img_data, np.uint8)
                image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
                
                if image is None:
                    logger.error("Failed to decode image")
                    await websocket.send_json({"error": "Failed to decode image"})
                    continue
                
                logger.debug(f"Decoded image shape: {image.shape}")

                try:
                    preprocessed_image = preprocess_frame(image)
                    logger.debug(f"Preprocessed image shape: {preprocessed_image.shape}")
                except Exception as e:
                    logger.error(f"Error during preprocessing: {str(e)}")
                    logger.error(traceback.format_exc())
                    await websocket.send_json({"error": "Image preprocessing failed"})
                    continue 

                # Ensure the model is predicting correctly
                try:
                    prediction = model.predict(preprocessed_image)
                    logger.debug(f"Raw prediction output: {prediction}")
                except Exception as e:
                    logger.error(f"Model prediction error: {str(e)}")
                    await websocket.send_json({"error": "Model prediction failed"})
                    continue

                class_index = np.argmax(prediction[0])
                confidence = float(prediction[0][class_index]) * 100
                predicted_class = settings.CLASS_LABELS[class_index]

                # Define bounding box dynamically (Optional logic)
                height, width = image.shape[:2]
                box_width = int(width * 0.5)
                box_height = int(height * 0.5)
                x = int(width * 0.25)
                y = int(height * 0.25)
                bbox = [x, y, box_width, box_height]

                logger.debug(f"Sending prediction: {predicted_class}, confidence: {confidence}, bbox: {bbox}")
                await websocket.send_json({
                    "defect": predicted_class,
                    "confidence": confidence,
                    "bbox": bbox
                })
                
            except WebSocketDisconnect:
                logger.info("WebSocket disconnected")
                break
            except Exception as e:
                logger.error(f"Error processing message: {str(e)}")
                logger.error(traceback.format_exc())
                await websocket.send_json({"error": str(e)})
    except Exception as e:
        logger.error(f"Unexpected WebSocket error: {str(e)}")
        logger.error(traceback.format_exc())
    finally:
        logger.debug("WebSocket connection closed")
