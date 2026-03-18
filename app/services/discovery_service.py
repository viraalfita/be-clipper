from __future__ import annotations

import json
import logging
import shutil
import subprocess
import sys
from typing import Any

from app.core.config import get_settings

logger = logging.getLogger(__name__)

_FALLBACK_CATALOG: list[dict[str, Any]] = [
    {
        "youtube_video_id": "dQw4w9WgXcQ",
        "title": "Rick Astley - Never Gonna Give You Up (Official Video)",
        "channel": "Rick Astley",
        "duration_seconds": 213,
        "keywords": ["never gonna", "music", "pop", "retro"],
    },
    {
        "youtube_video_id": "JGwWNGJdvx8",
        "title": "Ed Sheeran - Shape of You (Official Video)",
        "channel": "Ed Sheeran",
        "duration_seconds": 263,
        "keywords": ["music", "pop", "love", "dance"],
    },
    {
        "youtube_video_id": "9bZkp7q19f0",
        "title": "PSY - GANGNAM STYLE(Official Music Video)",
        "channel": "officialpsy",
        "duration_seconds": 253,
        "keywords": ["music", "dance", "viral", "fun"],
    },
    {
        "youtube_video_id": "kXYiU_JCYtU",
        "title": "Numb [Official Music Video] - Linkin Park",
        "channel": "Linkin Park",
        "duration_seconds": 187,
        "keywords": ["music", "rock", "motivation", "emotional"],
    },
    {
        "youtube_video_id": "fJ9rUzIMcZQ",
        "title": "Queen - Bohemian Rhapsody (Official Video)",
        "channel": "Queen Official",
        "duration_seconds": 354,
        "keywords": ["music", "classic", "rock", "epic"],
    },
]


def _normalize(text: str) -> str:
    return " ".join(text.lower().strip().split())


def _score_entry(entry: dict[str, Any], keyword: str, rank_index: int) -> float:
    title = _normalize(str(entry.get("title", "")))
    description = _normalize(str(entry.get("description", "")))
    keyword_norm = _normalize(keyword)

    title_hits = title.count(keyword_norm)
    description_hits = description.count(keyword_norm)
    token_hits = 0
    for token in keyword_norm.split():
        if token:
            token_hits += title.count(token) * 2
            token_hits += description.count(token)

    rank_bonus = max(0, 10 - rank_index)
    duration = int(entry.get("duration") or 0)
    duration_bonus = 2 if 60 <= duration <= 1200 else 0

    return round((title_hits * 5) + (description_hits * 2) + token_hits + rank_bonus + duration_bonus, 3)


def _fallback_videos(keyword: str, limit: int) -> list[dict[str, Any]]:
    keyword_norm = _normalize(keyword)
    tokens = [token for token in keyword_norm.split() if token]

    scored: list[dict[str, Any]] = []
    for idx, item in enumerate(_FALLBACK_CATALOG):
        title_norm = _normalize(item["title"])
        tag_norm = " ".join(item["keywords"])
        hits = sum(title_norm.count(token) for token in tokens)
        hits += sum(tag_norm.count(token) for token in tokens)
        score = float((hits * 8) + max(0, 10 - idx))

        video_id = item["youtube_video_id"]
        scored.append(
            {
                "youtube_url": f"https://www.youtube.com/watch?v={video_id}",
                "youtube_video_id": video_id,
                "title": item["title"],
                "channel": item["channel"],
                "thumbnail_url": f"https://i.ytimg.com/vi/{video_id}/maxresdefault.jpg",
                "duration_seconds": int(item["duration_seconds"]),
                "relevance_score": round(score, 3),
            }
        )

    scored.sort(key=lambda row: row["relevance_score"], reverse=True)
    return scored[:limit]


def search_videos_by_keyword(keyword: str, limit: int = 3) -> list[dict[str, Any]]:
    settings = get_settings()
    fetch_count = max(limit * 4, 8)
    search_query = f"ytsearch{fetch_count}:{keyword}"

    if shutil.which(settings.ytdlp_binary):
        command = [
            settings.ytdlp_binary,
            "--dump-single-json",
            "--skip-download",
            "--no-warnings",
            "--extractor-args",
            "youtube:skip=dash,hls",
            search_query,
        ]
    else:
        command = [
            sys.executable,
            "-m",
            "yt_dlp",
            "--dump-single-json",
            "--skip-download",
            "--no-warnings",
            "--extractor-args",
            "youtube:skip=dash,hls",
            search_query,
        ]

    result = subprocess.run(command, capture_output=True, text=True, timeout=30)
    if result.returncode != 0:
        logger.warning("Discovery command failed, using fallback catalog: %s", result.stderr.strip())
        return _fallback_videos(keyword, limit)

    try:
        payload = json.loads(result.stdout)
    except json.JSONDecodeError:
        logger.warning("Discovery command returned invalid JSON, using fallback catalog")
        return _fallback_videos(keyword, limit)

    entries = payload.get("entries", []) if isinstance(payload, dict) else []

    discovered: list[dict[str, Any]] = []
    for idx, entry in enumerate(entries):
        if not isinstance(entry, dict):
            continue

        video_id = str(entry.get("id") or "").strip()
        title = str(entry.get("title") or "").strip()
        if not video_id or not title:
            continue

        youtube_url = str(entry.get("webpage_url") or f"https://www.youtube.com/watch?v={video_id}")
        channel = str(entry.get("channel") or entry.get("uploader") or "Unknown channel")
        thumbnail = str(entry.get("thumbnail") or "")
        duration_seconds = int(entry.get("duration") or 0)

        discovered.append(
            {
                "youtube_url": youtube_url,
                "youtube_video_id": video_id,
                "title": title,
                "channel": channel,
                "thumbnail_url": thumbnail,
                "duration_seconds": duration_seconds,
                "relevance_score": _score_entry(entry, keyword, idx),
            }
        )

    discovered.sort(key=lambda item: item["relevance_score"], reverse=True)
    if not discovered:
        logger.warning("Discovery produced empty result, using fallback catalog")
        return _fallback_videos(keyword, limit)
    return discovered[:limit]
