from urllib.parse import parse_qs, urlencode, urlparse, urlunparse

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = Field(validation_alias="DATABASE_URL")
    app_name: str = Field(default="ShopAI", validation_alias="APP_NAME")
    debug: bool = Field(default=False, validation_alias="APP_DEBUG")
    gemini_api_key: str = Field(validation_alias="GEMINI_API_KEY")
    frontend_url: str | None = Field(default=None, validation_alias="FRONTEND_URL")
    auth_cookie_name: str = Field(
        default="shopai_session", validation_alias="AUTH_COOKIE_NAME"
    )
    session_ttl_seconds: int = Field(
        default=60 * 60 * 24 * 7, validation_alias="SESSION_TTL_SECONDS"
    )
    secure_cookies: bool = Field(default=False, validation_alias="SECURE_COOKIES")
    admin_email: str | None = Field(default=None, validation_alias="ADMIN_EMAIL")
    admin_password: str | None = Field(default=None, validation_alias="ADMIN_PASSWORD")
    database_pool_size: int = Field(default=10)
    database_max_overflow: int = Field(default=5)
    database_pool_timeout: int = Field(default=10)

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "case_sensitive": False,
        "extra": "ignore",
    }

    @field_validator("database_url", mode="before")
    @classmethod
    def clean_database_url(cls, v: str) -> str:
        if v.startswith("postgresql://"):
            v = v.replace("postgresql://", "postgresql+asyncpg://", 1)
        elif v.startswith("postgres://"):
            v = v.replace("postgres://", "postgresql+asyncpg://", 1)

        parsed = urlparse(v)
        query = parse_qs(parsed.query)

        # asyncpg doesn't support channel_binding — strip it
        query.pop("channel_binding", None)

        new_query = urlencode(query, doseq=True)
        v = urlunparse(parsed._replace(query=new_query))
        return v

    @field_validator("gemini_api_key", mode="before")
    @classmethod
    def strip_quotes(cls, v: str) -> str:
        return v.strip("'\"")


class CloudinarySettings(BaseSettings):
    cloud_name: str = Field(validation_alias="CLOUDINARY_CLOUD_NAME")
    api_key: str = Field(validation_alias="CLOUDINARY_API_KEY")
    upload_preset: str = Field(validation_alias="CLOUDINARY_UPLOAD_PRESET")
    api_secret: str = Field(validation_alias="CLOUDINARY_API_SECRET")

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "case_sensitive": False,
        "extra": "ignore",
    }


class KeepAliveSettings(BaseSettings):
    keep_alive_urls: str = Field(
        default="",
        validation_alias="KEEP_ALIVE_URLS",
        description="Comma-separated list of URLs to periodically ping",
    )
    keep_alive_interval_seconds: int = Field(
        default=600,
        validation_alias="KEEP_ALIVE_INTERVAL_SECONDS",
        description="Interval in seconds between keep-alive pings",
    )

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "case_sensitive": False,
        "extra": "ignore",
    }


settings = Settings()  # type: ignore[call-arg]
cloudinary_settings = CloudinarySettings()  # type: ignore[call-arg]
keep_alive_settings = KeepAliveSettings()
