from __future__ import annotations

from dataclasses import dataclass


HOOK_PATTERNS = (
    "here is",
    "this is why",
    "you need to",
    "the biggest mistake",
    "the key",
    "cara",
    "tips",
    "rahasia",
    "strategi",
)


@dataclass
class CandidateProposal:
    start_time: float
    end_time: float
    transcript_snippet: str
    topic_title: str
    score: float
    semantic_score: float | None
    selection_reason: str
    rank: int


def normalize_text(value: str) -> str:
    return " ".join(value.lower().strip().split())


def infer_topic_title(snippet: str) -> str:
    words = [word.strip(".,!?;:\"'()") for word in snippet.split() if word.strip()]
    if not words:
        return "Untitled Clip"
    title = " ".join(words[:8]).strip()
    return title[0:1].upper() + title[1:]


def score_candidate(
    *,
    snippet: str,
    duration: float,
    duration_target: int,
    keyword: str | None = None,
    duplicate_penalty: float = 0.0,
) -> tuple[float, str]:
    snippet_norm = normalize_text(snippet)
    keyword_norm = normalize_text(keyword or "")

    hook_hits = sum(1 for marker in HOOK_PATTERNS if marker in snippet_norm)
    hook_score = float(hook_hits * 1.5)

    keyword_score = 0.0
    if keyword_norm:
        keyword_score += snippet_norm.count(keyword_norm) * 3.0
        keyword_score += sum(snippet_norm.count(token) * 0.4 for token in keyword_norm.split())

    standalone_clarity = 1.0 if snippet.strip().endswith((".", "!", "?")) else 0.5
    duration_fit = max(0.0, 2.0 - abs(duration_target - duration) * 0.1)
    length_score = min(2.0, len(snippet_norm.split()) / 20.0)

    score = hook_score + keyword_score + standalone_clarity + duration_fit + length_score - duplicate_penalty
    reason = (
        f"hook_hits={hook_hits}, duration_fit={duration_fit:.2f}, "
        f"clarity={standalone_clarity:.1f}, keyword_score={keyword_score:.2f}"
    )
    return round(score, 4), reason


def dedupe_candidates(proposals: list[CandidateProposal], max_candidates: int) -> list[CandidateProposal]:
    deduped: list[CandidateProposal] = []

    for proposal in proposals:
        overlap = any(
            not (proposal.end_time <= existing.start_time or proposal.start_time >= existing.end_time)
            for existing in deduped
        )
        if overlap:
            continue
        deduped.append(proposal)
        if len(deduped) >= max_candidates:
            break

    for rank, item in enumerate(deduped, start=1):
        item.rank = rank

    return deduped
