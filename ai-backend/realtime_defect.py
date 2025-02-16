import cv2
import numpy as np
import tensorflow as tf
from tensorflow.keras.preprocessing.image import img_to_array
from PIL import Image

# Load trained model
MODEL_PATH = "D:/4TH YEAR/CAPSTONE/MEGG/ai-backend/model/egg_resnet50.keras"

try:
    model = tf.keras.models.load_model(MODEL_PATH)
    print("✅ Model loaded successfully!")
except Exception as e:
    print(f"❌ Error loading model: {e}")
    exit()

# Egg categories
CLASSES = ["cracked", "dirty", "good"]
IMG_WIDTH, IMG_HEIGHT = 224, 224  # Resize input images

def preprocess_frame(frame):
    """Convert OpenCV frame to model-compatible format"""
    img = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)  # Convert to RGB
    img = Image.fromarray(img)  # Convert OpenCV image to PIL image
    img = img.resize((IMG_WIDTH, IMG_HEIGHT))  # Resize to model's expected size
    img_array = img_to_array(img)
    img_array = np.expand_dims(img_array, axis=0)  # Add batch dimension
    img_array = tf.keras.applications.resnet50.preprocess_input(img_array)  # Apply ResNet50 preprocessing
    return img_array

def predict_defect(frame):
    """Perform real-time model prediction"""
    img_array = preprocess_frame(frame)
    prediction = model.predict(img_array)
    class_index = np.argmax(prediction[0])
    confidence = float(prediction[0][class_index]) * 100
    return CLASSES[class_index], confidence

# Start webcam capture
cap = cv2.VideoCapture(0)  # 0 for default webcam

if not cap.isOpened():
    print("❌ Error: Could not open webcam.")
    exit()

while True:
    ret, frame = cap.read()  # Read frame from webcam
    if not ret:
        print("❌ Error: Failed to grab frame.")
        break

    # Perform real-time defect detection
    label, confidence = predict_defect(frame)

    # Draw green bounding box around detected egg (assuming egg is centered)
    height, width, _ = frame.shape
    box_start = (int(width * 0.25), int(height * 0.25))
    box_end = (int(width * 0.75), int(height * 0.75))
    cv2.rectangle(frame, box_start, box_end, (0, 255, 0), 2)  # Green box

    # Display classification result
    text = f"{label} ({confidence:.2f}%)"
    cv2.putText(frame, text, (20, 40), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)

    # Show the live video feed
    cv2.imshow("Egg Quality Detection", frame)

    # Press 'q' to exit
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

# Release resources
cap.release()
cv2.destroyAllWindows()
