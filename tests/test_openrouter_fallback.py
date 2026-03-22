from app.services.candidate_service import CandidateProposal
from app.services.openrouter_service import rerank_candidates_with_openrouter


def test_openrouter_failure_fallback(monkeypatch) -> None:
    candidates = [
        CandidateProposal(
            start_time=0.0,
            end_time=18.0,
            transcript_snippet="Tips cepat untuk meningkatkan retention video.",
            topic_title="Tips retention",
            score=7.2,
            semantic_score=None,
            selection_reason="rule_based: baseline",
            rank=1,
        ),
        CandidateProposal(
            start_time=20.0,
            end_time=38.0,
            transcript_snippet="Cara bikin hook pembuka yang bikin penonton stay.",
            topic_title="Hook pembuka",
            score=6.9,
            semantic_score=None,
            selection_reason="rule_based: baseline",
            rank=2,
        ),
    ]

    class _BoomClient:
        def __init__(self, *args, **kwargs):
            pass

        def __enter__(self):
            return self

        def __exit__(self, exc_type, exc, tb):
            return False

        def post(self, *args, **kwargs):
            raise RuntimeError("network down")

    monkeypatch.setattr("app.services.openrouter_service.httpx.Client", _BoomClient)

    output = rerank_candidates_with_openrouter(
        candidates=candidates,
        clip_count=2,
        tone="educational",
        audience="general",
    )

    assert len(output) == 2
    assert output[0].rank == 1
    assert output[0].semantic_score is not None
