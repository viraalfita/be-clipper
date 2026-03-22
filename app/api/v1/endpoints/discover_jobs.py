from __future__ import annotations

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.discover_job import DiscoverJob
from app.models.enums import DiscoverJobStatus
from app.schemas.jobs import DiscoverJobCreateRequest, DiscoverJobCreateResponse, DiscoverJobListResponse, DiscoverJobOut

router = APIRouter()


@router.post("", response_model=DiscoverJobCreateResponse, status_code=status.HTTP_201_CREATED)
def create_discover_job(payload: DiscoverJobCreateRequest, db: Session = Depends(get_db)) -> DiscoverJobCreateResponse:
    item = DiscoverJob(
        topic=payload.topic,
        niche=payload.niche,
        goal=payload.goal,
        status=DiscoverJobStatus.queued,
        notes="Discovery flow coming soon. Search source integration pending.",
    )
    db.add(item)
    db.commit()
    db.refresh(item)

    return DiscoverJobCreateResponse(
        item=DiscoverJobOut(
            id=item.id,
            topic=item.topic,
            niche=item.niche,
            goal=item.goal,
            status=item.status.value,
            notes=item.notes,
            created_at=item.created_at,
            updated_at=item.updated_at,
        ),
        message="Discover job created. Discovery workflow is placeholder-ready for next phase.",
    )


@router.get("", response_model=DiscoverJobListResponse)
def list_discover_jobs(
    status_filter: str | None = Query(default=None, alias="status"),
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
) -> DiscoverJobListResponse:
    base_query = select(DiscoverJob)
    count_query = select(func.count()).select_from(DiscoverJob)

    if status_filter:
        base_query = base_query.where(DiscoverJob.status == status_filter)
        count_query = count_query.where(DiscoverJob.status == status_filter)

    items = db.execute(base_query.order_by(DiscoverJob.created_at.desc()).limit(limit).offset(offset)).scalars().all()
    total = db.execute(count_query).scalar_one()

    return DiscoverJobListResponse(
        items=[
            DiscoverJobOut(
                id=item.id,
                topic=item.topic,
                niche=item.niche,
                goal=item.goal,
                status=item.status.value,
                notes=item.notes,
                created_at=item.created_at,
                updated_at=item.updated_at,
            )
            for item in items
        ],
        total=int(total),
        limit=limit,
        offset=offset,
    )
