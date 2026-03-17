"use client";

import { FormEvent, useMemo, useState } from "react";

type Candidate = {
  id: string;
  start_time: number;
  end_time: number;
  score: number;
  rank: number;
  transcript_snippet: string;
};

type AnalyzeResponse = {
  job_id: string;
  status: string;
  transcript_found: boolean;
  candidates: Candidate[];
};

type RenderResponse = {
  job_id: string;
  render_status: string;
  storage_path: string;
  signed_url: string;
  clip_start: number;
  clip_end: number;
};

export default function Home() {
  const [youtubeUrl, setYoutubeUrl] = useState(
    "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  );
  const [keyword, setKeyword] = useState("never gonna");
  const [durationTarget, setDurationTarget] = useState(20);
  const [loadingAnalyze, setLoadingAnalyze] = useState(false);
  const [loadingRender, setLoadingRender] = useState(false);
  const [errorText, setErrorText] = useState("");
  const [analyzeResult, setAnalyzeResult] = useState<AnalyzeResponse | null>(
    null,
  );
  const [selectedCandidateId, setSelectedCandidateId] = useState("");
  const [renderResult, setRenderResult] = useState<RenderResponse | null>(null);

  const hasCandidates = (analyzeResult?.candidates?.length ?? 0) > 0;

  const selectedCandidate = useMemo(
    () =>
      analyzeResult?.candidates.find(
        (candidate) => candidate.id === selectedCandidateId,
      ),
    [analyzeResult?.candidates, selectedCandidateId],
  );

  async function handleAnalyze(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorText("");
    setRenderResult(null);
    setLoadingAnalyze(true);

    try {
      const response = await fetch("/api/autoclipper/api/v1/jobs/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          youtube_url: youtubeUrl,
          keyword,
          duration_target: durationTarget,
        }),
      });

      const data = (await response.json()) as
        | AnalyzeResponse
        | { detail?: string };
      if (!response.ok) {
        const detail =
          "detail" in data && data.detail
            ? data.detail
            : "Analyze request failed";
        throw new Error(detail);
      }

      const analyzeData = data as AnalyzeResponse;
      setAnalyzeResult(analyzeData);
      setSelectedCandidateId(analyzeData.candidates[0]?.id ?? "");
    } catch (error) {
      setAnalyzeResult(null);
      setSelectedCandidateId("");
      setErrorText(
        error instanceof Error ? error.message : "Unexpected analyze error",
      );
    } finally {
      setLoadingAnalyze(false);
    }
  }

  async function handleRender() {
    if (!analyzeResult || !selectedCandidateId) {
      setErrorText("Analyze job dulu lalu pilih candidate.");
      return;
    }

    setErrorText("");
    setLoadingRender(true);

    try {
      const response = await fetch(
        `/api/autoclipper/api/v1/jobs/${analyzeResult.job_id}/render`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ candidate_id: selectedCandidateId }),
        },
      );

      const data = (await response.json()) as
        | RenderResponse
        | { detail?: string };
      if (!response.ok) {
        const detail =
          "detail" in data && data.detail
            ? data.detail
            : "Render request failed";
        throw new Error(detail);
      }

      setRenderResult(data as RenderResponse);
    } catch (error) {
      setRenderResult(null);
      setErrorText(
        error instanceof Error ? error.message : "Unexpected render error",
      );
    } finally {
      setLoadingRender(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden px-6 py-10 md:px-10">
      <div className="aurora left-[-80px] top-[-100px]" />
      <div className="aurora right-[-120px] top-[40%]" />

      <section className="mx-auto w-full max-w-6xl">
        <div className="glass-panel mb-6 p-6 md:p-8">
          <p className="mono mb-3 text-xs uppercase tracking-[0.2em] text-slate-500">
            Autoclipper Studio
          </p>
          <h1 className="mb-2 text-3xl font-bold text-slate-900 md:text-4xl">
            Generate Short Clip in Minutes
          </h1>
          <p className="max-w-2xl text-sm text-slate-600 md:text-base">
            Frontend ini siap deploy di Vercel dan langsung terhubung ke backend
            production melalui API proxy internal.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
          <div className="glass-panel p-6 md:p-8">
            <h2 className="mb-4 text-xl font-semibold text-slate-900">
              Analyze YouTube
            </h2>
            <form className="space-y-4" onSubmit={handleAnalyze}>
              <label className="block text-sm font-medium text-slate-700">
                YouTube URL
                <input
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-900 outline-none ring-0 transition focus:border-cyan-400"
                  value={youtubeUrl}
                  onChange={(event) => setYoutubeUrl(event.target.value)}
                  required
                />
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm font-medium text-slate-700">
                  Keyword
                  <input
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-900 outline-none ring-0 transition focus:border-cyan-400"
                    value={keyword}
                    onChange={(event) => setKeyword(event.target.value)}
                    required
                  />
                </label>
                <label className="block text-sm font-medium text-slate-700">
                  Duration Target (sec)
                  <input
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-900 outline-none ring-0 transition focus:border-cyan-400"
                    value={durationTarget}
                    onChange={(event) =>
                      setDurationTarget(Number(event.target.value))
                    }
                    type="number"
                    min={5}
                    max={60}
                    required
                  />
                </label>
              </div>

              <button
                className="inline-flex items-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400"
                type="submit"
                disabled={loadingAnalyze}
              >
                {loadingAnalyze ? "Analyzing..." : "Analyze Now"}
              </button>
            </form>

            {errorText ? (
              <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                {errorText}
              </div>
            ) : null}

            {analyzeResult ? (
              <div className="mt-6 rounded-2xl border border-slate-200 bg-white/80 p-4">
                <p className="mono text-xs text-slate-500">Job ID</p>
                <p className="mb-3 break-all text-sm text-slate-800">
                  {analyzeResult.job_id}
                </p>
                <p className="text-sm text-slate-700">
                  Status: <strong>{analyzeResult.status}</strong>
                </p>
                <p className="text-sm text-slate-700">
                  Transcript Found:{" "}
                  <strong>{String(analyzeResult.transcript_found)}</strong>
                </p>
              </div>
            ) : null}
          </div>

          <div className="glass-panel p-6 md:p-8">
            <h2 className="mb-4 text-xl font-semibold text-slate-900">
              Candidates & Render
            </h2>

            {hasCandidates ? (
              <div className="space-y-3">
                {analyzeResult?.candidates.map((candidate) => (
                  <label
                    className="block cursor-pointer rounded-xl border border-slate-200 bg-white p-3 transition hover:border-cyan-300"
                    key={candidate.id}
                  >
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="candidate"
                          value={candidate.id}
                          checked={selectedCandidateId === candidate.id}
                          onChange={(event) =>
                            setSelectedCandidateId(event.target.value)
                          }
                        />
                        <span className="mono text-xs text-slate-600">
                          Rank #{candidate.rank}
                        </span>
                      </div>
                      <span className="text-xs font-semibold text-cyan-700">
                        Score {candidate.score.toFixed(2)}
                      </span>
                    </div>
                    <p className="mb-1 text-xs text-slate-500">
                      {candidate.start_time.toFixed(2)}s -{" "}
                      {candidate.end_time.toFixed(2)}s
                    </p>
                    <p className="line-clamp-3 text-sm text-slate-700">
                      {candidate.transcript_snippet}
                    </p>
                  </label>
                ))}

                <button
                  className="mt-2 inline-flex items-center rounded-xl bg-cyan-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-cyan-500 disabled:cursor-not-allowed disabled:bg-cyan-300"
                  type="button"
                  onClick={handleRender}
                  disabled={loadingRender || !selectedCandidateId}
                >
                  {loadingRender ? "Rendering..." : "Render Selected Clip"}
                </button>
              </div>
            ) : (
              <p className="text-sm text-slate-500">
                Belum ada candidate. Jalankan analyze dulu.
              </p>
            )}

            {selectedCandidate ? (
              <div className="mt-6 rounded-2xl border border-cyan-200 bg-cyan-50 p-4">
                <p className="mono text-xs text-cyan-700">Selected Candidate</p>
                <p className="mb-1 break-all text-sm text-cyan-900">
                  {selectedCandidate.id}
                </p>
                <p className="text-sm text-cyan-800">
                  {selectedCandidate.start_time.toFixed(2)}s -{" "}
                  {selectedCandidate.end_time.toFixed(2)}s
                </p>
              </div>
            ) : null}

            {renderResult ? (
              <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                <p className="mono text-xs text-emerald-700">Render Success</p>
                <p className="text-sm text-emerald-900">
                  Status: {renderResult.render_status}
                </p>
                <a
                  className="mt-2 inline-flex text-sm font-semibold text-emerald-800 underline"
                  href={renderResult.signed_url}
                  rel="noreferrer"
                  target="_blank"
                >
                  Open rendered video
                </a>
              </div>
            ) : null}
          </div>
        </div>
      </section>
    </main>
  );
}
