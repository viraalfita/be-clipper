from fastapi import APIRouter

from app.api.v1.endpoints.discover_jobs import router as discover_jobs_router
from app.api.v1.endpoints.health import router as health_router
from app.api.v1.endpoints.jobs import router as jobs_router

api_router = APIRouter()
api_router.include_router(health_router, tags=["health"])
api_router.include_router(discover_jobs_router, prefix="/api/v1/discover-jobs", tags=["discover-jobs"])
api_router.include_router(jobs_router, prefix="/api/v1/jobs", tags=["jobs"])
