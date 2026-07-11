import os
from dotenv import load_dotenv

load_dotenv(override=True)

class Config:
    MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
    DATABASE_NAME = os.getenv("DATABASE_NAME", "iot_mart")
    SECRET_KEY = os.getenv("SECRET_KEY", "09d25e094faa6ca2556c818166b7a9563b93f7099f6f0f4caa6cf63b88e8d3e7")
    ALGORITHM = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 30 # 30 days
    GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
    NEXAR_CLIENT_ID = os.getenv("NEXAR_CLIENT_ID", "")
    NEXAR_CLIENT_SECRET = os.getenv("NEXAR_CLIENT_SECRET", "")
    REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    GMAIL_USER = os.getenv("GMAIL_USER", "")
    GMAIL_PASSWORD = os.getenv("GMAIL_PASSWORD", "")

settings = Config()
