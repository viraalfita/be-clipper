"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";

type DashboardClientProps = {
  userEmail: string;
};

type Mode = "discover" | "auto_detect";

type DiscoverJob = {
  id: string;
  topic: string;
  niche: string;
  goal: string;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

type DiscoverCreateResponse = {
  item: DiscoverJob;
  message: string;
};

type ClipCandidate = {
  id: string;
  start_time: number;
  end_time: number;
  transcript_snippet: string;
  topic_title: string;
  score: number;
  semantic_score: number | null;
  selection_reason: string;
  rank: number;
  preview_url: string;
  embed_url: string;
};

type AnalyzeResponse = {
  job_id: string;
  mode: string;
  status: string;
  transcript_found: boolean;
  candidates: ClipCandidate[];
};

type RenderResponse = {
  job_id: string;
  render_status: string;
  storage_path: string;
  signed_url: string;
  clip_start: number;
  clip_end: number;
};

type ScheduleResponse = {
  job_id: string;
  scheduled_at: string;
  caption: string;
  status: string;
};

type ClipJobItem = {
  id: string;
  mode: string;
  youtube_url: string | null;
  keyword: string | null;
  status: string;
  transcript_found: boolean;
  created_at: string;
  updated_at: string;
};

type ClipJobListResponse = {
  items: ClipJobItem[];
  total: number;
  limit: number;
  offset: number;
};

type DiscoverJobListResponse = {
  items: DiscoverJob[];
  total: number;
  limit: number;
  offset: number;
};

type ApiError = {
  detail?: string;
};

export function DashboardClient({ userEmail }: DashboardClientProps) {
  const router = useRouter();

  const [activeMode, setActiveMode] = useState<Mode>("discover");
  const [loggingOut, setLoggingOut] = useState(false);

  const [topic, setTopic] = useState("");
  const [niche, setNiche] = useState("");
  const [goal, setGoal] = useState("find good videos to turn into clips");

  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [clipCount, setClipCount] = useState(5);
  const [durationTarget, setDurationTarget] = useState(20);
  const [tone, setTone] = useState("educational");
  const [audience, setAudience] = useState("general");
  const [keyword, setKeyword] = useState("");

  const [discoverLoading, setDiscoverLoading] = useState(false);
  const [analyzeLoading, setAnalyzeLoading] = useState(false);
  const [renderLoading, setRenderLoading] = useState(false);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [jobsLoading, setJobsLoading] = useState(false);

  const [errorText, setErrorText] = useState("");
  const [successText, setSuccessText] = useState("");

  const [discoverJob, setDiscoverJob] = useState<DiscoverJob | null>(null);
  const [analyzeResult, setAnalyzeResult] = useState<AnalyzeResponse | null>(
    null,
  );
  const [selectedCandidateId, setSelectedCandidateId] = useState("");
  const [renderResult, setRenderResult] = useState<RenderResponse | null>(null);
  const [scheduleResult, setScheduleResult] = useState<ScheduleResponse | null>(
    null,
  );

  const [scheduledAt, setScheduledAt] = useState("");
  const [caption, setCaption] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [clipJobs, setClipJobs] = useState<ClipJobItem[]>([]);
  const [discoverJobs, setDiscoverJobs] = useState<DiscoverJob[]>([]);

  const selectedCandidate = useMemo(
    () =>
      analyzeResult?.candidates.find(
        (item) => item.id === selectedCandidateId,
      ) ?? null,
    [analyzeResult?.candidates, selectedCandidateId],
  );

  async function readJson<T>(response: Response): Promise<T | ApiError> {
    const text = await response.text();
    if (!text) {
      return {};
    }
    try {
      return JSON.parse(text) as T | ApiError;
    } catch {
      return { detail: text };
    }
  }

  function resetMessages() {
    setErrorText("");
    setSuccessText("");
  }

  function formatDate(value: string): string {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return value;
    }
    return parsed.toLocaleString();
  }

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.replace("/login");
    } finally {
      setLoggingOut(false);
    }
  }

  async function loadDashboards() {
    setJobsLoading(true);
    try {
      const query = statusFilter
        ? `?status=${encodeURIComponent(statusFilter)}`
        : "";
      const [clipRes, discoverRes] = await Promise.all([
        fetch(`/api/autoclipper/api/v1/jobs${query}`, { cache: "no-store" }),
        fetch("/api/autoclipper/api/v1/discover-jobs", { cache: "no-store" }),
      ]);

      const clipData = (await readJson<ClipJobListResponse>(clipRes)) as
        | ClipJobListResponse
        | ApiError;
      const discoverData = (await readJson<DiscoverJobListResponse>(
        discoverRes,
      )) as DiscoverJobListResponse | ApiError;

      if (!clipRes.ok) {
        throw new Error(
          (clipData as ApiError).detail ?? "Failed to load clip jobs",
        );
      }
      if (!discoverRes.ok) {
        throw new Error(
          (discoverData as ApiError).detail ?? "Failed to load discover jobs",
        );
      }

      setClipJobs((clipData as ClipJobListResponse).items ?? []);
      setDiscoverJobs((discoverData as DiscoverJobListResponse).items ?? []);
    } catch (error) {
      setErrorText(
        error instanceof Error ? error.message : "Failed to load dashboard",
      );
    } finally {
      setJobsLoading(false);
    }
  }

  async function handleCreateDiscoverJob(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    resetMessages();
    setDiscoverLoading(true);

    try {
      const response = await fetch("/api/autoclipper/api/v1/discover-jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, niche, goal }),
      });
      const data = (await readJson<DiscoverCreateResponse>(response)) as
        | DiscoverCreateResponse
        | ApiError;

      if (!response.ok) {
        throw new Error(
          (data as ApiError).detail ?? "Failed to create discover job",
        );
      }

      const payload = data as DiscoverCreateResponse;
      setDiscoverJob(payload.item);
      setSuccessText(payload.message);
      await loadDashboards();
    } catch (error) {
      setErrorText(
        error instanceof Error ? error.message : "Unexpected discover error",
      );
    } finally {
      setDiscoverLoading(false);
    }
  }

  async function handleAnalyze(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    resetMessages();
    setAnalyzeLoading(true);
    setRenderResult(null);
    setScheduleResult(null);

    try {
      const response = await fetch("/api/autoclipper/api/v1/jobs/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "auto_detect",
          youtube_url: youtubeUrl,
          clip_count: clipCount,
          duration_target: durationTarget,
          tone: tone || null,
          audience: audience || null,
          keyword: keyword || null,
        }),
      });
      const data = (await readJson<AnalyzeResponse>(response)) as
        | AnalyzeResponse
        | ApiError;
      if (!response.ok) {
        throw new Error((data as ApiError).detail ?? "Failed to analyze video");
      }

      const payload = data as AnalyzeResponse;
      setAnalyzeResult(payload);
      setSelectedCandidateId(payload.candidates[0]?.id ?? "");
      setSuccessText(
        payload.candidates.length > 0
          ? `Analyze selesai. ${payload.candidates.length} candidate ditemukan.`
          : "Analyze selesai tanpa candidate.",
      );
      await loadDashboards();
    } catch (error) {
      setErrorText(
        error instanceof Error ? error.message : "Unexpected analyze error",
      );
      setAnalyzeResult(null);
      setSelectedCandidateId("");
    } finally {
      setAnalyzeLoading(false);
    }
  }

  async function handleRenderSelected() {
    if (!analyzeResult || !selectedCandidateId) {
      setErrorText("Pilih candidate dulu sebelum render.");
      return;
    }

    resetMessages();
    setRenderLoading(true);

    try {
      const response = await fetch(
        `/api/autoclipper/api/v1/jobs/${analyzeResult.job_id}/render`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ candidate_id: selectedCandidateId }),
        },
      );
      const data = (await readJson<RenderResponse>(response)) as
        | RenderResponse
        | ApiError;

      if (!response.ok) {
        throw new Error(
          (data as ApiError).detail ?? "Failed to render selected candidate",
        );
      }

      setRenderResult(data as RenderResponse);
      setSuccessText(
        "Render selesai. Kamu bisa isi schedule metadata sekarang.",
      );
      await loadDashboards();
    } catch (error) {
      setErrorText(
        error instanceof Error ? error.message : "Unexpected render error",
      );
    } finally {
      setRenderLoading(false);
    }
  }

  async function handleSchedule(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!analyzeResult) {
      setErrorText("Analyze job belum ada.");
      return;
    }

    resetMessages();
    setScheduleLoading(true);

    try {
      const response = await fetch(
        `/api/autoclipper/api/v1/jobs/${analyzeResult.job_id}/schedule`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ scheduled_at: scheduledAt, caption }),
        },
      );
      const data = (await readJson<ScheduleResponse>(response)) as
        | ScheduleResponse
        | ApiError;

      if (!response.ok) {
        throw new Error(
          (data as ApiError).detail ?? "Failed to schedule upload metadata",
        );
      }

      setScheduleResult(data as ScheduleResponse);
      setSuccessText("Schedule metadata tersimpan.");
      await loadDashboards();
    } catch (error) {
      setErrorText(
        error instanceof Error ? error.message : "Unexpected schedule error",
      );
    } finally {
      setScheduleLoading(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden px-4 py-8 sm:px-6 lg:px-10">
      <div className="spot spot-a" />
      <div className="spot spot-b" />

      <section className="mx-auto max-w-7xl space-y-6">
        <header className="panel p-6 md:p-8">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <span className="chip">Autoclipper Product Console</span>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-slate-900 px-3 py-1 text-xs text-white">
                {userEmail}
              </span>
              <button
                className="btn btn-soft"
                onClick={handleLogout}
                disabled={loggingOut}
                type="button"
              >
                {loggingOut ? "Signing out..." : "Sign out"}
              </button>
            </div>
          </div>

          <h1 className="text-3xl font-semibold text-slate-950 md:text-4xl">
            2 Mode Workflow: Discover + Auto Detect
          </h1>
          <p className="mt-3 max-w-3xl text-sm text-slate-600 md:text-base">
            Discover Mode menyimpan intent pencarian untuk pipeline discovery
            berikutnya. Auto Detect Mode menganalisis transcript YouTube,
            menghasilkan kandidat clip, lalu render dan jadwalkan metadata
            upload.
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setActiveMode("discover")}
              className={`mode-card ${activeMode === "discover" ? "mode-card-active" : ""}`}
            >
              <p className="mode-title">Discover Videos</p>
              <p className="mode-desc">
                Mulai dari topik/niche dan simpan intent discovery job.
              </p>
            </button>
            <button
              type="button"
              onClick={() => setActiveMode("auto_detect")}
              className={`mode-card ${activeMode === "auto_detect" ? "mode-card-active" : ""}`}
            >
              <p className="mode-title">Use YouTube Link</p>
              <p className="mode-desc">
                Input link YouTube dan generate top candidate clips otomatis.
              </p>
            </button>
          </div>
        </header>

        {errorText ? (
          <div className="alert alert-error">{errorText}</div>
        ) : null}
        {successText ? (
          <div className="alert alert-success">{successText}</div>
        ) : null}

        {activeMode === "discover" ? (
          <section className="panel p-6 md:p-8">
            <h2 className="section-title">Discover Mode</h2>
            <p className="section-subtitle">
              Placeholder workflow yang valid: data disimpan sebagai discover
              job untuk fase integrasi source berikutnya.
            </p>

            <form
              className="mt-5 grid gap-4 md:grid-cols-2"
              onSubmit={handleCreateDiscoverJob}
            >
              <label className="field">
                Topic
                <input
                  className="input"
                  value={topic}
                  onChange={(event) => setTopic(event.target.value)}
                  required
                />
              </label>
              <label className="field">
                Niche
                <input
                  className="input"
                  value={niche}
                  onChange={(event) => setNiche(event.target.value)}
                  required
                />
              </label>
              <label className="field md:col-span-2">
                Goal
                <textarea
                  className="input min-h-28"
                  value={goal}
                  onChange={(event) => setGoal(event.target.value)}
                  required
                />
              </label>
              <div className="md:col-span-2">
                <button
                  className="btn btn-primary"
                  type="submit"
                  disabled={discoverLoading}
                >
                  {discoverLoading ? "Creating..." : "Start Discovery"}
                </button>
              </div>
            </form>

            {discoverJob ? (
              <article className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                <p className="font-semibold">Discover job created</p>
                <p className="mt-1">ID: {discoverJob.id}</p>
                <p className="mt-1">Status: {discoverJob.status}</p>
                <p className="mt-2">{discoverJob.notes}</p>
              </article>
            ) : null}
          </section>
        ) : (
          <section className="panel p-6 md:p-8">
            <h2 className="section-title">Auto Detect from YouTube</h2>
            <p className="section-subtitle">
              Analyze transcript, generate candidate windows, pre-score
              rule-based, lalu rerank semantik dengan OpenRouter.
            </p>

            <form
              className="mt-5 grid gap-4 md:grid-cols-2"
              onSubmit={handleAnalyze}
            >
              <label className="field md:col-span-2">
                YouTube URL
                <input
                  className="input"
                  value={youtubeUrl}
                  onChange={(event) => setYoutubeUrl(event.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                  required
                />
              </label>
              <label className="field">
                Number of Clips
                <input
                  className="input"
                  type="number"
                  min={1}
                  max={12}
                  value={clipCount}
                  onChange={(event) => setClipCount(Number(event.target.value))}
                  required
                />
              </label>
              <label className="field">
                Duration Target (seconds)
                <input
                  className="input"
                  type="number"
                  min={10}
                  max={90}
                  value={durationTarget}
                  onChange={(event) =>
                    setDurationTarget(Number(event.target.value))
                  }
                  required
                />
              </label>
              <label className="field">
                Tone (optional)
                <input
                  className="input"
                  value={tone}
                  onChange={(event) => setTone(event.target.value)}
                />
              </label>
              <label className="field">
                Audience (optional)
                <input
                  className="input"
                  value={audience}
                  onChange={(event) => setAudience(event.target.value)}
                />
              </label>
              <label className="field md:col-span-2">
                Focus keyword (optional)
                <input
                  className="input"
                  value={keyword}
                  onChange={(event) => setKeyword(event.target.value)}
                />
              </label>
              <div className="md:col-span-2">
                <button
                  className="btn btn-primary"
                  type="submit"
                  disabled={analyzeLoading}
                >
                  {analyzeLoading ? "Analyzing..." : "Analyze Video"}
                </button>
              </div>
            </form>
          </section>
        )}

        <section className="panel p-6 md:p-8">
          <h2 className="section-title">Analyze Result</h2>
          <p className="section-subtitle">
            Topic title, score, reason, transcript snippet, dan preview setiap
            candidate.
          </p>

          {analyzeResult && analyzeResult.candidates.length > 0 ? (
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {analyzeResult.candidates.map((candidate) => (
                <article key={candidate.id} className="candidate-card">
                  <div className="flex items-center justify-between gap-2">
                    <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-800">
                      <input
                        type="radio"
                        name="candidate"
                        value={candidate.id}
                        checked={selectedCandidateId === candidate.id}
                        onChange={(event) =>
                          setSelectedCandidateId(event.target.value)
                        }
                      />
                      Rank #{candidate.rank}
                    </label>
                    <span className="chip chip-score">
                      Score {candidate.score.toFixed(2)}
                    </span>
                  </div>
                  <h3 className="mt-2 text-base font-semibold text-slate-900">
                    {candidate.topic_title}
                  </h3>
                  <p className="mt-2 text-xs text-slate-500">
                    {candidate.start_time.toFixed(2)}s -{" "}
                    {candidate.end_time.toFixed(2)}s
                  </p>
                  <p className="mt-2 line-clamp-4 text-sm text-slate-700">
                    {candidate.transcript_snippet}
                  </p>
                  <p className="mt-2 text-xs text-slate-600">
                    Reason: {candidate.selection_reason}
                  </p>

                  <div className="mt-3 overflow-hidden rounded-xl border border-slate-200">
                    <iframe
                      className="aspect-video w-full"
                      title={`candidate-preview-${candidate.id}`}
                      src={candidate.embed_url}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="mt-4 rounded-2xl border border-dashed border-slate-300 p-5 text-sm text-slate-600">
              Belum ada hasil analyze. Jalankan mode YouTube Link untuk
              menghasilkan candidate.
            </div>
          )}
        </section>

        <section className="panel p-6 md:p-8">
          <h2 className="section-title">Candidate Review and Render Result</h2>
          <p className="section-subtitle">
            Pilih candidate, render final clip, lalu simpan metadata schedule
            upload.
          </p>

          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            <article className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">
                Selected Candidate
              </p>
              {selectedCandidate ? (
                <>
                  <p className="mt-2 text-sm font-semibold text-slate-900">
                    {selectedCandidate.topic_title}
                  </p>
                  <p className="mt-1 text-xs text-slate-600">
                    {selectedCandidate.start_time.toFixed(2)}s -{" "}
                    {selectedCandidate.end_time.toFixed(2)}s
                  </p>
                  <p className="mt-2 text-sm text-slate-700">
                    {selectedCandidate.transcript_snippet}
                  </p>
                  <button
                    className="btn btn-primary mt-4"
                    onClick={handleRenderSelected}
                    disabled={renderLoading}
                  >
                    {renderLoading
                      ? "Rendering..."
                      : "Render Selected Candidate"}
                  </button>
                </>
              ) : (
                <p className="mt-2 text-sm text-slate-600">
                  Pilih candidate dari section Analyze Result.
                </p>
              )}
            </article>

            <article className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">
                Render Result
              </p>
              {renderResult ? (
                <>
                  <p className="mt-2 text-sm text-slate-700">
                    Status: {renderResult.render_status}
                  </p>
                  <p className="mt-2 break-all text-xs text-slate-600">
                    Storage path: {renderResult.storage_path}
                  </p>
                  <a
                    className="mt-3 inline-flex text-sm font-semibold text-cyan-700 underline"
                    href={renderResult.signed_url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open rendered video
                  </a>
                </>
              ) : (
                <p className="mt-2 text-sm text-slate-600">
                  Belum ada hasil render.
                </p>
              )}
            </article>
          </div>

          <form
            className="mt-6 grid gap-4 md:grid-cols-2"
            onSubmit={handleSchedule}
          >
            <label className="field">
              Schedule time
              <input
                className="input"
                type="datetime-local"
                value={scheduledAt}
                onChange={(event) => setScheduledAt(event.target.value)}
                required
              />
            </label>
            <label className="field">
              Caption
              <input
                className="input"
                value={caption}
                onChange={(event) => setCaption(event.target.value)}
                required
              />
            </label>
            <div className="md:col-span-2">
              <button
                className="btn btn-soft"
                type="submit"
                disabled={scheduleLoading || !renderResult}
              >
                {scheduleLoading
                  ? "Saving schedule..."
                  : "Save Schedule Metadata"}
              </button>
            </div>
          </form>

          {scheduleResult ? (
            <article className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
              Scheduled at: {formatDate(scheduleResult.scheduled_at)} | Status:{" "}
              {scheduleResult.status}
            </article>
          ) : null}
        </section>

        <section className="panel p-6 md:p-8">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="section-title">Jobs Dashboard</h2>
              <p className="section-subtitle">
                List discover jobs + clip jobs dengan badge mode dan filter
                status.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <select
                className="input h-10 min-w-44"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
              >
                <option value="">All statuses</option>
                <option value="queued">queued</option>
                <option value="analyzed">analyzed</option>
                <option value="rendering">rendering</option>
                <option value="rendered">rendered</option>
                <option value="scheduled">scheduled</option>
                <option value="failed">failed</option>
              </select>
              <button
                className="btn btn-soft"
                onClick={loadDashboards}
                disabled={jobsLoading}
                type="button"
              >
                {jobsLoading ? "Refreshing..." : "Refresh Jobs"}
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            <article className="rounded-2xl border border-slate-200 bg-white p-4">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-600">
                Clip Jobs
              </h3>
              {clipJobs.length > 0 ? (
                <ul className="mt-3 space-y-2">
                  {clipJobs.map((job) => (
                    <li
                      key={job.id}
                      className="rounded-xl border border-slate-200 p-3 text-sm"
                    >
                      <div className="mb-1 flex flex-wrap items-center gap-2">
                        <span className="chip chip-mode">mode: {job.mode}</span>
                        <span className="chip">status: {job.status}</span>
                      </div>
                      <p className="break-all text-xs text-slate-600">
                        {job.youtube_url ?? "n/a"}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        Created: {formatDate(job.created_at)}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-sm text-slate-600">
                  Belum ada clip jobs.
                </p>
              )}
            </article>

            <article className="rounded-2xl border border-slate-200 bg-white p-4">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-600">
                Discover Jobs
              </h3>
              {discoverJobs.length > 0 ? (
                <ul className="mt-3 space-y-2">
                  {discoverJobs.map((job) => (
                    <li
                      key={job.id}
                      className="rounded-xl border border-slate-200 p-3 text-sm"
                    >
                      <div className="mb-1 flex flex-wrap items-center gap-2">
                        <span className="chip chip-mode">mode: discover</span>
                        <span className="chip">status: {job.status}</span>
                      </div>
                      <p className="font-medium text-slate-900">{job.topic}</p>
                      <p className="text-xs text-slate-600">
                        Niche: {job.niche}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        Created: {formatDate(job.created_at)}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-sm text-slate-600">
                  Belum ada discover jobs.
                </p>
              )}
            </article>
          </div>
        </section>
      </section>
    </main>
  );
}
