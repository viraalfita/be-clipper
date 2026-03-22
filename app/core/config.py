from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = Field(default="Autoclipper MVP Backend", alias="APP_NAME")
    app_env: str = Field(default="development", alias="APP_ENV")
    app_host: str = Field(default="0.0.0.0", alias="APP_HOST")
    app_port: int = Field(default=8000, alias="APP_PORT")
    app_version: str = Field(default="0.1.0", alias="APP_VERSION")
    log_level: str = Field(default="INFO", alias="LOG_LEVEL")

    database_url: str = Field(default="sqlite:///./autoclipper.db", alias="DATABASE_URL")

    supabase_url: str = Field(default="https://example.supabase.co", alias="SUPABASE_URL")
    supabase_service_role_key: str = Field(default="dummy-service-role-key", alias="SUPABASE_SERVICE_ROLE_KEY")
    supabase_storage_bucket: str = Field(default="autoclipper-renders", alias="SUPABASE_STORAGE_BUCKET")
    supabase_signed_url_expires_in: int = Field(default=3600, alias="SUPABASE_SIGNED_URL_EXPIRES_IN")

    openrouter_api_key: str = Field(default="", alias="OPENROUTER_API_KEY")
    openrouter_model: str = Field(default="openrouter/free", alias="OPENROUTER_MODEL")
    openrouter_base_url: str = Field(default="https://openrouter.ai/api/v1", alias="OPENROUTER_BASE_URL")
    max_candidates_before_rerank: int = Field(default=12, alias="MAX_CANDIDATES_BEFORE_RERANK")

    temp_dir: str = Field(default="/tmp/autoclipper", alias="TEMP_DIR")
    ffmpeg_binary: str = Field(default="ffmpeg", alias="FFMPEG_BINARY")
    ytdlp_binary: str = Field(default="yt-dlp", alias="YTDLP_BINARY")
    ytdlp_format: str = Field(
        default="bv*[vcodec^=avc1][ext=mp4]+ba[ext=m4a]/b[ext=mp4]/best[ext=mp4]/best",
        alias="YTDLP_FORMAT",
    )
    discovery_command_timeout_seconds: int = Field(default=60, alias="DISCOVERY_COMMAND_TIMEOUT_SECONDS")
    render_command_timeout_seconds: int = Field(default=900, alias="RENDER_COMMAND_TIMEOUT_SECONDS")
    render_video_crf: int = Field(default=18, alias="RENDER_VIDEO_CRF")
    render_video_preset: str = Field(default="veryfast", alias="RENDER_VIDEO_PRESET")
    render_ffmpeg_threads: int = Field(default=2, alias="RENDER_FFMPEG_THREADS")
    render_audio_bitrate: str = Field(default="192k", alias="RENDER_AUDIO_BITRATE")
    render_target_width: int = Field(default=720, alias="RENDER_TARGET_WIDTH")
    render_target_height: int = Field(default=1280, alias="RENDER_TARGET_HEIGHT")
    render_burn_subtitle: bool = Field(default=True, alias="RENDER_BURN_SUBTITLE")


@lru_cache
def get_settings() -> Settings:
    return Settings()
