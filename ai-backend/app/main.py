from fastapi import FastAPI, File, UploadFile
import uvicorn
import tensorflow as tf
import numpy as np
import shutil
from tensorflow.keras.preprocessing.image import img_to_array, load_img
from pathlib import Path

# Initialize FastAPI app
app = FastAPI()

# Path to trained model
MODEL_PATH = "model/egg_resnet50.keras"

# Load trained model
try:
    model = tf.keras.models.load_model(MODEL_PATH)
    print("✅ Model loaded successfully!")
except Exception as e:
    print(f"❌ Error loading model: {e}")
    exit()

# Define egg classes
CLASS_LABELS = ["cracked", "dirty", "good"]  # Modify based on dataset

# Image dimensions (match training size)
IMG_WIDTH, IMG_HEIGHT = 224, 224

# Directory for saving uploaded images
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

def preprocess_image(image_path):
    """Load & preprocess image for prediction"""
    img = load_img(image_path, target_size=(IMG_WIDTH, IMG_HEIGHT))  # Load and resize
    img_array = img_to_array(img)  # Convert to array
    img_array = np.expand_dims(img_array, axis=0)  # Add batch dimension
    img_array = tf.keras.applications.resnet50.preprocess_input(img_array)  # Normalize
    return img_array

def predict_defect(image_path):
    """Predict egg quality defect"""
    img_array = preprocess_image(image_path)
    prediction = model.predict(img_array)  # Model prediction
    class_index = np.argmax(prediction[0])  # Get highest confidence class
    confidence = float(prediction[0][class_index]) * 100  # Convert to percentage
    predicted_class = CLASS_LABELS[class_index]  # Get class label
    return predicted_class, confidence

@app.post("/upload/")
async def upload_file(file: UploadFile = File(...)):
    """Upload image and return defect prediction"""
    file_path = UPLOAD_DIR / file.filename
    
    # Save the uploaded file
    with file_path.open("wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Predict defect
    label, confidence = predict_defect(file_path)

    return {
        "filename": file.filename,
        "predicted_class": label,
        "confidence": f"{confidence:.2f}%",
    }

# Run FastAPI server
if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
