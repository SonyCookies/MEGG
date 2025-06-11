# D:\4THYEAR\CAPSTONE\MEGG\ai-inference-backend\app\core\model_loader.py

import os
import logging
from dotenv import load_dotenv
import tensorflow as tf

logger = logging.getLogger(__name__)
load_dotenv()

_model = None

def load_model():
    global _model
    try:
        model_path = os.getenv("MODEL_PATH")
        if not model_path or not os.path.exists(model_path):
            logger.error(f"Model file does not exist at: {model_path}")
            return None

        _model = tf.keras.models.load_model(model_path)
        logger.info(f"Model loaded from {model_path}")
    except Exception as e:
        logger.exception("Failed to load model")

def get_model():
    return _model
