from __future__ import annotations

from dataclasses import dataclass

from app.services.candidate_service import CandidateProposal, dedupe_candidates, infer_topic_title, score_candidate


@dataclass
class TranscriptSegment:
    start: float
    end: float
    text: str


def normalize_transcript_segments(transcript: list[dict[str, float | str]]) -> list[TranscriptSegment]:
    segments: list[TranscriptSegment] = []
    for item in transcript:
        text = str(item.get("text") or "").strip()
        if not text:
            continue

        start = float(item.get("start") or 0.0)
        duration = float(item.get("duration") or 0.0)
        end = max(start, start + duration)
        segments.append(TranscriptSegment(start=start, end=end, text=text))

    return segments


def generate_candidate_windows(
    segments: list[TranscriptSegment],
    *,
    duration_target: int,
    keyword: str | None,
    max_candidates_before_rerank: int,
) -> list[CandidateProposal]:
    if not segments:
        return []

    max_duration = max(float(duration_target) + 8.0, 12.0)
    min_duration = max(float(duration_target) - 8.0, 8.0)

    proposals: list[CandidateProposal] = []
    for start_idx, current in enumerate(segments):
        window_start = current.start
        window_end = current.end
        parts = [current.text]

        for cursor in range(start_idx + 1, len(segments)):
            if (window_end - window_start) >= max_duration:
                break
            next_segment = segments[cursor]
            tentative_end = next_segment.end
            if tentative_end - window_start > max_duration:
                break
            parts.append(next_segment.text)
            window_end = tentative_end

        duration = window_end - window_start
        if duration < min_duration:
            continue

        snippet = " ".join(parts).strip()
        duplicate_penalty = 0.0
        if proposals:
            prev_snippet = proposals[-1].transcript_snippet
            shared_prefix = len(set(snippet.lower().split()) & set(prev_snippet.lower().split()))
            duplicate_penalty = min(1.5, shared_prefix / 40.0)

        score, reason = score_candidate(
            snippet=snippet,
            duration=duration,
            duration_target=duration_target,
            keyword=keyword,
            duplicate_penalty=duplicate_penalty,
        )

        proposals.append(
            CandidateProposal(
                start_time=round(window_start, 3),
                end_time=round(window_end, 3),
                transcript_snippet=snippet,
                topic_title=infer_topic_title(snippet),
                score=score,
                semantic_score=None,
                selection_reason=f"rule_based: {reason}",
                rank=0,
            )
        )

    proposals.sort(key=lambda item: (item.score, -(item.end_time - item.start_time)), reverse=True)
    return dedupe_candidates(proposals, max_candidates=max_candidates_before_rerank)
