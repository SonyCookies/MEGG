import tensorflow as tf
import numpy as np
from tensorflow.keras.preprocessing.image import load_img, img_to_array
from tensorflow.keras.applications.resnet50 import preprocess_input
from app.config import settings

def preprocess_image(image):
    """
    Preprocess the image for the trained ResNet50 model.
    
    :param image: A numpy array representing the image
    :return: Preprocessed image array
    """
    image = tf.keras.preprocessing.image.array_to_img(image)

    image = image.resize((settings.IMG_WIDTH, settings.IMG_HEIGHT))
    img_array = img_to_array(image)
    img_array = np.expand_dims(img_array, axis=0)
    img_array = preprocess_input(img_array)

    return img_array
