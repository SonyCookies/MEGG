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

def predict_defect(image_data):
    model = get_model()
    if model is None:
        raise RuntimeError("Model is not loaded.")
    
    img_array = preprocess_image(image_data)
    prediction = model.predict(img_array)
    class_index = np.argmax(prediction)
    confidence = float(prediction[0][class_index])
    predicted_class = CLASS_LABELS[class_index]
    return predicted_class, confidence