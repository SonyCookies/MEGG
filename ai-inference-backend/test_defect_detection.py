import base64
import asyncio
import tkinter as tk
from tkinter import filedialog
from app.actions.defect_detection import handle_defect_detection
from app.core.model_loader import load_model

def pick_image():
    root = tk.Tk()
    root.withdraw()  # Hide the main window
    file_path = filedialog.askopenfilename(
        title="Select Image",
        filetypes=[("Image files", "*.jpg *.jpeg *.png")]
    )
    return file_path

def encode_image_to_base64(image_path):
    with open(image_path, "rb") as img_file:
        encoded = base64.b64encode(img_file.read()).decode("utf-8")
        return f"data:image/jpeg;base64,{encoded}"

async def run_test():
    load_model()
    file_path = pick_image()
    if not file_path:
        print("No file selected.")
        return

    image_data = encode_image_to_base64(file_path)
    message = {"image": image_data}

    result = await handle_defect_detection(message)
    print("\nPrediction Result:")
    print(result)

if __name__ == "__main__":
    asyncio.run(run_test())
