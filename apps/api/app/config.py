from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str = "postgresql+psycopg://recallflow:recallflow@localhost:55432/recallflow"
    jwt_secret: str = "change-me"
    jwt_expires_days: int = 7
    cookie_secure: bool = False
    cors_origins: str = "http://localhost:5001,http://localhost:5002"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
