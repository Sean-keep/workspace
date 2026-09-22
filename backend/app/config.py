import secrets
from typing import List, Optional

from pydantic import model_validator
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Application
    APP_NAME: str = "Personal Workspace"
    APP_VERSION: str = "1.1.0"
    DEBUG: bool = False

    # Database
    DB_HOST: str = "workspace-mysql"
    DB_PORT: int = 3306
    DB_USER: str = "workspace"
    DB_PASSWORD: str = ""
    DB_NAME: str = "personal_workspace"
    DB_POOL_SIZE: int = 5
    DB_MAX_OVERFLOW: int = 10

    @property
    def DATABASE_URL(self) -> str:
        return (
            f"mysql+pymysql://{self.DB_USER}:{self.DB_PASSWORD}"
            f"@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"
        )

    # Redis
    REDIS_HOST: str = "workspace-redis"
    REDIS_PORT: int = 6379
    REDIS_DB: int = 0
    REDIS_PASSWORD: Optional[str] = None

    @property
    def REDIS_URL(self) -> str:
        auth = f":{self.REDIS_PASSWORD}@" if self.REDIS_PASSWORD else ""
        return f"redis://{auth}{self.REDIS_HOST}:{self.REDIS_PORT}/{self.REDIS_DB}"

    # JWT
    # Empty SECRET_KEY generates an ephemeral key at boot (tokens die on restart).
    # Always set it in production — see .env.example.
    SECRET_KEY: str = ""
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 120
    REFRESH_TOKEN_EXPIRE_DAYS: int = 14

    # Login rate limiting
    LOGIN_RATE_LIMIT_MAX: int = 5
    LOGIN_RATE_LIMIT_WINDOW: int = 300  # seconds

    # Bootstrap admin (only created when the users table is empty)
    ADMIN_USERNAME: str = "admin"
    ADMIN_PASSWORD: str = "admin123"
    ADMIN_EMAIL: str = "admin@example.com"

    # CORS — comma-separated origins, e.g. "https://a.com,https://b.com"
    # Kept as a plain string: pydantic-settings would try to JSON-decode a
    # List[str] env var before any validator could split it.
    CORS_ORIGINS: str = "http://localhost:3001,http://localhost:3000"

    @property
    def cors_origins(self) -> List[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]

    @model_validator(mode="after")
    def _ensure_secret_key(self):
        if not self.SECRET_KEY:
            object.__setattr__(self, "SECRET_KEY", secrets.token_urlsafe(48))
            object.__setattr__(self, "_ephemeral_secret", True)
        else:
            object.__setattr__(self, "_ephemeral_secret", False)
        return self

    @property
    def is_secret_ephemeral(self) -> bool:
        return bool(getattr(self, "_ephemeral_secret", False))

    model_config = {"env_file": ".env", "case_sensitive": True, "extra": "ignore"}


settings = Settings()
