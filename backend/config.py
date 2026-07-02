import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "AI-Powered Traffic Violation Detection System"
    API_V1_STR: str = "/api/v1"
    
    # Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "super_secret_key_change_me_in_production_123456789")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours
    
    # Database
    # Standard postgres syntax: postgresql://username:password@host:port/database
    # SQLite fallback by default for local environment ease
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./traffic_violations.db")
    
    # File Storage
    BASE_DIR: str = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    UPLOAD_DIR: str = os.path.join(BASE_DIR, "uploads")
    
    # AI Settings
    YOLO_MODEL: str = os.getenv("YOLO_MODEL", "yolov8n.pt")  # Use Nano model for lightweight CPU run
    AI_CONFIDENCE_THRESHOLD: float = 0.25
    SPEED_LIMIT_KMH: float = 60.0
    
    class Config:
        case_sensitive = True

settings = Settings()

# Ensure uploads directories exist
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
os.makedirs(os.path.join(settings.UPLOAD_DIR, "evidence_images"), exist_ok=True)
os.makedirs(os.path.join(settings.UPLOAD_DIR, "evidence_videos"), exist_ok=True)
os.makedirs(os.path.join(settings.UPLOAD_DIR, "plates"), exist_ok=True)
