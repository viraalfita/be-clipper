from app.services.segmentation_service import generate_candidate_windows, normalize_transcript_segments


def test_segmentation_and_scoring_generates_ranked_candidates() -> None:
    transcript = [
        {"start": 0.0, "duration": 4.0, "text": "Ini intro singkat"},
        {"start": 4.0, "duration": 5.0, "text": "Tips penting untuk growth marketing bisnis."},
        {"start": 9.0, "duration": 5.0, "text": "Ini alasan kenapa hook opening sangat menentukan."},
        {"start": 14.0, "duration": 4.0, "text": "Gunakan CTA yang jelas di akhir."},
    ]

    segments = normalize_transcript_segments(transcript)
    candidates = generate_candidate_windows(
        segments,
        duration_target=15,
        keyword="marketing",
        max_candidates_before_rerank=6,
    )

    assert len(candidates) >= 1
    assert candidates[0].rank == 1
    assert candidates[0].topic_title
    assert candidates[0].selection_reason.startswith("rule_based")
