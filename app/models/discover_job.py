from uuid import uuid4

from sqlalchemy import Enum, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin
from app.models.enums import DiscoverJobStatus


class DiscoverJob(Base, TimestampMixin):
    __tablename__ = "discover_jobs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    topic: Mapped[str] = mapped_column(String(255), nullable=False)
    niche: Mapped[str] = mapped_column(String(255), nullable=False)
    goal: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[DiscoverJobStatus] = mapped_column(
        Enum(DiscoverJobStatus, name="discover_job_status"),
        nullable=False,
        default=DiscoverJobStatus.queued,
    )
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
