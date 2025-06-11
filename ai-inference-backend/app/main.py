# D:\4THYEAR\CAPSTONE\MEGG\ai-inference-backend\app\main.py

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.websocket.websocket_server import websocket_endpoint
from app.core.model_loader import load_model

app = FastAPI()

@app.on_event("startup")
async def startup_event():
  load_model()

app.add_middleware(
  CORSMiddleware,
  allow_origins=["*"],
  allow_credentials=True,
  allow_methods=["*"],
  allow_headers=["*"],
)

app.add_api_websocket_route("/ws", websocket_endpoint)

if __name__ == "__main__":
  import uvicorn
  uvicorn.run("app.main:app", host="0.0.0.0", port=8000)


  