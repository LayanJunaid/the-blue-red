from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+asyncpg://blured:blured123@db:5432/blureddb"

    OPENAI_API_KEY: str = ""
    OPENAI_MODEL: str = "llama-3.3-70b-versatile"
    OPENAI_BASE_URL: str = "https://api.groq.com/openai/v1"

    SECRET_KEY: str = "dev-secret-change-in-production"
    ENVIRONMENT: str = "development"

    JWT_SECRET_KEY: str = "strongSecretkyeuNeedToChangeThis"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 1440

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @property
    def llm_enabled(self) -> bool:
        return bool(self.OPENAI_API_KEY)


settings = Settings()