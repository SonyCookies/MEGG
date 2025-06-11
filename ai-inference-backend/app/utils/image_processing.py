
# D:\4THYEAR\CAPSTONE\MEGG\ai-inference-backend\app\utils\image_processing.py
import base64
import logging
import numpy as np
import tensorflow as tf
from app.core.model_loader import get_model

logger = logging.getLogger(__name__)

IMG_WIDTH, IMG_HEIGHT = 224, 224
CLASS_LABELS = ["cracked", "dirty", "good"]

def preprocess_image(image_data): 
  try: 
    image = tf.image.decode_image(base64.b64decode(image_data.split(',')[1]))
    image = tf.image.resize(image, (IMG_WIDTH, IMG_HEIGHT))
    image = tf.keras.applications.resnet50.preprocess_input(image)
    return tf.expand_dims(image, 0)
  except Exception as e:
    logger.error(f"Error preprocessing image: {e}")
    raise

# Example of what might be happening in predict_defect
def predict_defect(image_data):
    model = get_model()
    if model is None:
        raise Exception("model is not loaded")
    
    # Process image...
    processed_image = preprocess_image(image_data)
    
    # Get prediction
    predictions = model.predict(processed_image)
    
    # This might be causing the error if predictions is empty
    predicted_class_index = np.argmax(predictions[0])  # Error if predictions is empty
    class_labels = ["cracked", "dirty", "good"]
    predicted_class = class_labels[predicted_class_index]  # Error if index is out of range
    
    confidence = float(predictions[0][predicted_class_index] * 100)  # Error if index is out of range
    
    return predicted_class, confidence