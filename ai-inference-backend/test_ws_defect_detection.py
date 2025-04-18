import asyncio
import websockets
import base64
import json

# Replace with your image path
IMAGE_PATH = "sample_egg.jpg"

# Helper to encode image to base64
def encode_image_to_base64(image_path):
    with open(image_path, "rb") as image_file:
        encoded_string = base64.b64encode(image_file.read()).decode('utf-8')
        return f"data:image/jpeg;base64,{encoded_string}"

async def test_websocket():
    uri = "ws://localhost:8000/ws"  # Replace with your FastAPI WebSocket route
    image_data = encode_image_to_base64(IMAGE_PATH)

    async with websockets.connect(uri) as websocket:
        # Prepare the message
        message = {
            "action": "defect_detection",
            "image": image_data
        }

        await websocket.send(json.dumps(message))
        print("Image sent for defect detection...")

        # Receive response
        response = await websocket.recv()
        print("Received response:")
        print(json.loads(response))

if __name__ == "__main__":
    asyncio.run(test_websocket())
