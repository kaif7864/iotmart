from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    MONGODB_URL: str = "mongodb://localhost:27017"
    DATABASE_NAME: str = "iot_mart"
    SECRET_KEY: str = "09d25e094faa6ca2556c818166b7a9563b93f7099f6f0f4caa6cf63b88e8d3e7"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 43200 # 30 days
    GROQ_API_KEY: str = ""
    NEXAR_CLIENT_ID: str = ""
    NEXAR_CLIENT_SECRET: str = ""
    REDIS_URL: str = "redis://localhost:6379/0"
    GMAIL_USER: str = ""
    GMAIL_PASSWORD: str = ""
    GOOGLE_CLIENT_ID: str = ""
    TWILIO_ACCOUNT_SID: str = ""
    TWILIO_AUTH_TOKEN: str = ""
    TWILIO_PHONE_NUMBER: str = ""
    CASHFREE_APP_ID: str = ""
    CASHFREE_SECRET_KEY: str = ""
    CASHFREE_WEBHOOK_SECRET: str = ""
    CASHFREE_API_URL: str = "https://sandbox.cashfree.com/pg/orders"
    SHIPROCKET_EMAIL: str = ""
    SHIPROCKET_PASSWORD: str = ""
    FRONTEND_URL: str = "http://localhost:5173"
    ALLOWED_ORIGINS: str = "http://localhost:5173,http://localhost:3000,https://iotmart.vercel.app"
    BREVO_API_KEY: str = ""
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()
