from enum import Enum


class ClipJobMode(str, Enum):
    auto_detect = "auto_detect"


class ClipJobStatus(str, Enum):
    queued = "queued"
    analyzed = "analyzed"
    rendering = "rendering"
    rendered = "rendered"
    scheduled = "scheduled"
    uploaded = "uploaded"
    failed = "failed"


class DiscoverJobStatus(str, Enum):
    queued = "queued"
    researching = "researching"
    ready = "ready"
    failed = "failed"
