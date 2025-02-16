from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    MODEL_PATH: str = "model/egg_resnet50.keras"
    CLASS_LABELS: list = ["cracked", "dirty", "good"]
    IMG_WIDTH: int = 224
    IMG_HEIGHT: int = 224
    
    class Config:
        env_file = ".env"

settings = Settings()