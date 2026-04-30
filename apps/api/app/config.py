from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_env: str = "development"
    database_url: str = "postgresql+psycopg://recallflow:recallflow@localhost:55432/recallflow"
    jwt_secret: str = "change-me"
    jwt_expires_days: int = 7
    cookie_name: str = "recallflow_session"
    cookie_secure: bool = False
    cors_origins: str = "http://localhost:5001,http://localhost:5002"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    def model_post_init(self, __context: object) -> None:
        if self.app_env == "production" and self.jwt_secret == "change-me":
            raise ValueError("生产环境必须配置 JWT_SECRET")


@lru_cache
def get_settings() -> Settings:
    return Settings()
