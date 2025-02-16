import tensorflow as tf
import numpy as np
from tensorflow.keras.preprocessing.image import load_img, img_to_array

MODEL_PATH = "D:/4TH YEAR/CAPSTONE/MEGG/ai-backend/model/egg_resnet50.keras"

IMAGE_PATH = "D:/4TH YEAR/CAPSTONE/MEGG/ai-backend/testing_images/dirty2.jpg"

IMG_WIDTH, IMG_HEIGHT = 224, 224

CLASS_LABELS = ["cracked", "dirty", "good"] 

model = tf.keras.models.load_model(MODEL_PATH)

def preprocess_image(image_path):
    img = load_img(image_path, target_size=(IMG_WIDTH, IMG_HEIGHT))
    img_array = img_to_array(img)
    img_array = np.expand_dims(img_array, axis=0)  # Add batch dimension
    img_array = tf.keras.applications.resnet50.preprocess_input(img_array)  
    return img_array

def predict_defect(image_path):
    img_array = preprocess_image(image_path)
    prediction = model.predict(img_array) 
    class_index = np.argmax(prediction) 
    confidence = prediction[0][class_index] * 100  
    predicted_class = CLASS_LABELS[class_index] 
    return predicted_class, confidence

if __name__ == "__main__":
    label, confidence = predict_defect(IMAGE_PATH)
    print(f"Predicted: {label} ({confidence:.2f}%)")
