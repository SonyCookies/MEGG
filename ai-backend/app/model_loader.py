import tensorflow as tf
from app.config import settings

def load_model():
    try:
        model = tf.keras.models.load_model(settings.MODEL_PATH)
        print(f"Model loaded successfully from {settings.MODEL_PATH}")
        return model
    except Exception as e:
        print(f"Error loading model: {str(e)}")
        return None