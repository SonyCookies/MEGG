from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.model_loader import load_model
from app.websocket_server import router as websocket_router

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    app.state.model = load_model()
    if app.state.model is None:
        raise Exception("Failed to load the model")

app.include_router(websocket_router)

@app.get("/")
async def root():
    return {"message": "Egg Defect Detection API is running"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        app,
        host=settings.HOST,
        port=settings.PORT,
        ssl_keyfile=None,  # Add this line
        ssl_certfile=None,  # Add this line
    )

