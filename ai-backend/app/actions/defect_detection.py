import base64
import logging
import io
import tensorflow as tf
import numpy as np
from tensorflow.keras.preprocessing.image import load_img, img_to_array

logger = logging.getLogger(__name__)

MODEL_PATH = "D:/4TH YEAR/CAPSTONE/MEGG/ai-backend/model/egg_resnet50.keras"
IMG_WIDTH, IMG_HEIGHT = 224, 224
CLASS_LABELS = ["cracked", "dirty", "good"]

# Load the model globally so it's only loaded once
model = tf.keras.models.load_model(MODEL_PATH)

def preprocess_image(image_data):
    # Convert base64 string to image
    image = tf.image.decode_image(base64.b64decode(image_data.split(',')[1]))
    image = tf.image.resize(image, (IMG_WIDTH, IMG_HEIGHT))
    image = tf.keras.applications.resnet50.preprocess_input(image)
    return tf.expand_dims(image, 0)  # Add batch dimension

def predict_defect(image_data):
    img_array = preprocess_image(image_data)
    prediction = model.predict(img_array)
    class_index = np.argmax(prediction)
    confidence = float(prediction[0][class_index])  # Convert to Python float
    predicted_class = CLASS_LABELS[class_index]
    return predicted_class, confidence

async def handle_defect_detection(message):
    try:
        # Ensure message is a dictionary
        if isinstance(message, str):
            # Convert string message into a dictionary assuming it's raw base64 image data
            image_data = message
        elif isinstance(message, dict):
            image_data = message.get('image', None)
        else:
            logger.error(f"Unexpected message type: {type(message)}")
            return {
                "action": "defect_detection_result",
                "error": "Invalid message format"
            }
        
        if not image_data:
            logger.error("No image data received in the message")
            return {
                "action": "defect_detection_result",
                "error": "No image data received"
            }

        logger.info("Received image data for defect detection")

        # Perform the actual defect detection
        predicted_class, confidence = predict_defect(image_data)

        return {
            "action": "defect_detection_result",
            "defects": [predicted_class],
            "confidence": confidence,
            "image": image_data  # Include the original image data in the response
        }

    except Exception as e:
        logger.exception("Error in handle_defect_detection")
        return {
            "action": "defect_detection_result",
            "error": str(e)
        }

