import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
    DATABASE_NAME = os.getenv("DATABASE_NAME", "iot_mart")
    SECRET_KEY = os.getenv("SECRET_KEY", "your-neural-link-secret")
    ALGORITHM = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 30 # 30 days
    GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
    NEXAR_CLIENT_ID = os.getenv("NEXAR_CLIENT_ID", "")
    NEXAR_CLIENT_SECRET = os.getenv("NEXAR_CLIENT_SECRET", "")

settings = Config()
