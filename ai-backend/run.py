# run.py
import uvicorn
from app.main import app
from app.config import settings

if __name__ == "__main__":
    uvicorn.run(app, host=settings.HOST, port=settings.PORT)