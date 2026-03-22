"""add discover mode and semantic candidate fields

Revision ID: 20260320_0002
Revises: 20260318_0001
Create Date: 2026-03-20 09:00:00
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision = "20260320_0002"
down_revision = "20260318_0001"
branch_labels = None
depends_on = None


clip_job_mode_enum = postgresql.ENUM("auto_detect", name="clip_job_mode", create_type=False)
discover_job_status_enum = postgresql.ENUM(
    "queued",
    "researching",
    "ready",
    "failed",
    name="discover_job_status",
    create_type=False,
)


def upgrade() -> None:
    bind = op.get_bind()
    clip_job_mode_enum.create(bind, checkfirst=True)
    discover_job_status_enum.create(bind, checkfirst=True)

    with op.batch_alter_table("clip_jobs") as batch_op:
        batch_op.add_column(sa.Column("mode", sa.Enum("auto_detect", name="clip_job_mode"), nullable=True))
        batch_op.add_column(sa.Column("clip_count", sa.Integer(), nullable=True))
        batch_op.add_column(sa.Column("tone", sa.String(length=120), nullable=True))
        batch_op.add_column(sa.Column("audience", sa.String(length=120), nullable=True))

    op.execute("UPDATE clip_jobs SET mode='auto_detect' WHERE mode IS NULL")
    op.execute("UPDATE clip_jobs SET clip_count=5 WHERE clip_count IS NULL")

    with op.batch_alter_table("clip_jobs") as batch_op:
        batch_op.alter_column("mode", existing_type=sa.Enum("auto_detect", name="clip_job_mode"), nullable=False)
        batch_op.alter_column("clip_count", existing_type=sa.Integer(), nullable=False)
        batch_op.alter_column("youtube_url", existing_type=sa.Text(), nullable=True)
        batch_op.alter_column("youtube_video_id", existing_type=sa.String(length=32), nullable=True)
        batch_op.alter_column("keyword", existing_type=sa.String(length=255), nullable=True)

    with op.batch_alter_table("clip_candidates") as batch_op:
        batch_op.add_column(sa.Column("topic_title", sa.String(length=255), nullable=True))
        batch_op.add_column(sa.Column("semantic_score", sa.Float(), nullable=True))
        batch_op.add_column(sa.Column("selection_reason", sa.Text(), nullable=True))

    op.execute("UPDATE clip_candidates SET topic_title='Untitled Clip' WHERE topic_title IS NULL")
    op.execute(
        "UPDATE clip_candidates SET selection_reason='rule_based: migration default' "
        "WHERE selection_reason IS NULL"
    )

    with op.batch_alter_table("clip_candidates") as batch_op:
        batch_op.alter_column("topic_title", existing_type=sa.String(length=255), nullable=False)
        batch_op.alter_column("selection_reason", existing_type=sa.Text(), nullable=False)

    op.create_table(
        "discover_jobs",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("topic", sa.String(length=255), nullable=False),
        sa.Column("niche", sa.String(length=255), nullable=False),
        sa.Column("goal", sa.Text(), nullable=False),
        sa.Column("status", discover_job_status_enum, nullable=False),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )


def downgrade() -> None:
    op.drop_table("discover_jobs")

    with op.batch_alter_table("clip_candidates") as batch_op:
        batch_op.drop_column("selection_reason")
        batch_op.drop_column("semantic_score")
        batch_op.drop_column("topic_title")

    with op.batch_alter_table("clip_jobs") as batch_op:
        batch_op.alter_column("keyword", existing_type=sa.String(length=255), nullable=False)
        batch_op.alter_column("youtube_video_id", existing_type=sa.String(length=32), nullable=False)
        batch_op.alter_column("youtube_url", existing_type=sa.Text(), nullable=False)
        batch_op.drop_column("audience")
        batch_op.drop_column("tone")
        batch_op.drop_column("clip_count")
        batch_op.drop_column("mode")

    discover_job_status_enum.drop(op.get_bind(), checkfirst=True)
    clip_job_mode_enum.drop(op.get_bind(), checkfirst=True)
