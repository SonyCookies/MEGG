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
    
    try:
        while True:
            try:
                data = await websocket.receive_text()
                logger.debug(f"Received data of length: {len(data)}")
                
                # Decode base64 image
                img_data = base64.b64decode(data.split(',')[1])
                nparr = np.frombuffer(img_data, np.uint8)
                image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
                
                logger.debug(f"Decoded image shape: {image.shape}")
                
                # Preprocess image
                try:
                    preprocessed_image = preprocess_frame(image)
                    logger.debug(f"Preprocessed image shape: {preprocessed_image.shape}")
                except Exception as e:
                    logger.error(f"Error during preprocessing: {str(e)}")
                    logger.error(traceback.format_exc())
                    await websocket.send_json({"error": "Image preprocessing failed"})
                    continue  # Skip this frame and continue with the next one
                
                # Predict
                prediction = websocket.app.state.model.predict(preprocessed_image)
                logger.debug(f"Raw prediction: {prediction}")
                
                class_index = np.argmax(prediction[0])
                confidence = float(prediction[0][class_index]) * 100
                predicted_class = settings.CLASS_LABELS[class_index]
                
                # Calculate bounding box (assuming egg is centered)
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
        logger.error(f"Unexpected error in WebSocket connection: {str(e)}")
        logger.error(traceback.format_exc())
    finally:
        logger.debug("WebSocket connection closed")

