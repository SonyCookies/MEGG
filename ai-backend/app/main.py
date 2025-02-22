# D:\4TH YEAR\CAPSTONE\MEGG\ai-backend\app\main.py

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .websocket_server import websocket_endpoint

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

app.add_api_websocket_route("/ws", websocket_endpoint)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)