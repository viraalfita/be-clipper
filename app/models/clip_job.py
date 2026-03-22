from datetime import datetime
from uuid import uuid4

from sqlalchemy import Boolean, DateTime, Enum, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin
from app.models.enums import ClipJobMode, ClipJobStatus


class ClipJob(Base, TimestampMixin):
    __tablename__ = "clip_jobs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    mode: Mapped[ClipJobMode] = mapped_column(
        Enum(ClipJobMode, name="clip_job_mode"),
        nullable=False,
        default=ClipJobMode.auto_detect,
    )
    youtube_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    youtube_video_id: Mapped[str | None] = mapped_column(String(32), nullable=True, index=True)
    keyword: Mapped[str | None] = mapped_column(String(255), nullable=True)
    clip_count: Mapped[int] = mapped_column(Integer, nullable=False, default=5)
    duration_target: Mapped[int] = mapped_column(Integer, nullable=False, default=20)
    tone: Mapped[str | None] = mapped_column(String(120), nullable=True)
    audience: Mapped[str | None] = mapped_column(String(120), nullable=True)
    status: Mapped[ClipJobStatus] = mapped_column(Enum(ClipJobStatus, name="clip_job_status"), nullable=False)
    transcript_found: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    selected_candidate_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    render_storage_path: Mapped[str | None] = mapped_column(Text, nullable=True)
    render_signed_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    scheduled_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    caption: Mapped[str | None] = mapped_column(Text, nullable=True)
    failure_reason: Mapped[str | None] = mapped_column(Text, nullable=True)

    candidates = relationship("ClipCandidate", back_populates="job", cascade="all, delete-orphan")
    metrics = relationship("ClipMetric", back_populates="job", cascade="all, delete-orphan")
