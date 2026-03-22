from __future__ import annotations

import json
import logging
from dataclasses import replace

import httpx

from app.core.config import get_settings
from app.services.candidate_service import CandidateProposal

logger = logging.getLogger(__name__)


class OpenRouterError(RuntimeError):
    pass


def _build_prompt(candidates: list[CandidateProposal], clip_count: int) -> str:
    payload = [
        {
            "id": str(index + 1),
            "start_time": item.start_time,
            "end_time": item.end_time,
            "topic_title": item.topic_title,
            "snippet": item.transcript_snippet[:320],
            "rule_score": item.score,
        }
        for index, item in enumerate(candidates)
    ]

    return (
        "You are ranking short-form clip candidates. "
        "Return ONLY JSON with key 'selected' as an array. "
        "Each item must include: id, semantic_score, topic_title, selection_reason, rank. "
        f"Select at most {clip_count} items.\nCandidates:\n"
        + json.dumps(payload, ensure_ascii=True)
    )


def rerank_candidates_with_openrouter(
    *,
    candidates: list[CandidateProposal],
    clip_count: int,
    tone: str | None,
    audience: str | None,
) -> list[CandidateProposal]:
    settings = get_settings()
    if not candidates:
        return []

    if not settings.openrouter_api_key:
        logger.info("OPENROUTER_API_KEY is empty; skipping semantic rerank")
        return _fallback(candidates, clip_count)

    prompt = _build_prompt(candidates, clip_count)
    if tone or audience:
        prompt += f"\nContext: tone={tone or 'default'}, audience={audience or 'general'}"

    url = f"{settings.openrouter_base_url.rstrip('/')}/chat/completions"

    try:
        with httpx.Client(timeout=45.0) as client:
            response = client.post(
                url,
                headers={
                    "Authorization": f"Bearer {settings.openrouter_api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": settings.openrouter_model,
                    "messages": [
                        {"role": "system", "content": "You output valid JSON only."},
                        {"role": "user", "content": prompt},
                    ],
                    "temperature": 0.2,
                    "response_format": {"type": "json_object"},
                },
            )
            response.raise_for_status()
    except Exception as exc:
        logger.warning("OpenRouter request failed: %s", exc)
        return _fallback(candidates, clip_count)

    try:
        data = response.json()
        content = data["choices"][0]["message"]["content"]
        parsed = json.loads(content)
        selected = parsed.get("selected", [])
        if not isinstance(selected, list):
            raise OpenRouterError("Invalid selected payload")
    except Exception as exc:
        logger.warning("OpenRouter parse failed: %s", exc)
        return _fallback(candidates, clip_count)

    mapped_by_id: dict[str, CandidateProposal] = {str(i + 1): item for i, item in enumerate(candidates)}
    reranked: list[CandidateProposal] = []

    for row in selected:
        if not isinstance(row, dict):
            continue
        row_id = str(row.get("id") or "")
        base = mapped_by_id.get(row_id)
        if not base:
            continue

        semantic_score_raw = row.get("semantic_score")
        semantic_score = float(semantic_score_raw) if isinstance(semantic_score_raw, (float, int)) else None
        merged = replace(
            base,
            topic_title=str(row.get("topic_title") or base.topic_title),
            semantic_score=semantic_score,
            selection_reason=str(row.get("selection_reason") or "selected by semantic rerank"),
            rank=int(row.get("rank") or 0),
        )
        reranked.append(merged)

    if not reranked:
        return _fallback(candidates, clip_count)

    reranked.sort(key=lambda item: item.rank if item.rank > 0 else 999)
    reranked = reranked[:clip_count]

    for rank, item in enumerate(reranked, start=1):
        item.rank = rank

    return reranked


def _fallback(candidates: list[CandidateProposal], clip_count: int) -> list[CandidateProposal]:
    fallback = [
        replace(
            item,
            semantic_score=item.semantic_score if item.semantic_score is not None else item.score,
            selection_reason=item.selection_reason or "fallback rule-based ranking",
        )
        for item in candidates[:clip_count]
    ]

    for rank, item in enumerate(fallback, start=1):
        item.rank = rank

    return fallback
