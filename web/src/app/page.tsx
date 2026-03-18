import Link from "next/link";

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden px-6 py-10 md:px-10">
      <div className="aurora left-[-100px] top-[-90px]" />
      <div className="aurora right-[-130px] top-[55%]" />

      <section className="mx-auto w-full max-w-6xl">
        <header className="glass-panel mb-6 p-6 md:p-8">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <p className="mono text-xs uppercase tracking-[0.2em] text-slate-500">
              Autoclipper Studio
            </p>
            <div className="flex gap-2">
              <Link
                href="/register"
                className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                Register
              </Link>
              <Link
                href="/login"
                className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                Login
              </Link>
              <Link
                href="/dashboard"
                className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
              >
                Open Dashboard
              </Link>
            </div>
          </div>

          <h1 className="mb-3 text-4xl font-bold text-slate-900 md:text-5xl">
            Automate Short-Form Clip Production
          </h1>
          <p className="max-w-3xl text-sm text-slate-600 md:text-base">
            Landing page untuk production deployment. Sistem ini mengorkestrasi
            alur keyword discovery, clip analysis, rendering, dan publish
            pipeline ke TikTok API via n8n.
          </p>
        </header>

        <div className="grid gap-6 md:grid-cols-3">
          <article className="glass-panel p-6">
            <h2 className="mb-2 text-lg font-semibold text-slate-900">
              Discover
            </h2>
            <p className="text-sm text-slate-600">
              Cari video relevan dari keyword, pilih opsi terbaik, dan validasi
              sebelum render.
            </p>
          </article>
          <article className="glass-panel p-6">
            <h2 className="mb-2 text-lg font-semibold text-slate-900">
              Render
            </h2>
            <p className="text-sm text-slate-600">
              Generate output vertikal siap publish dengan kontrol kualitas dan
              pipeline yang stabil.
            </p>
          </article>
          <article className="glass-panel p-6">
            <h2 className="mb-2 text-lg font-semibold text-slate-900">
              Publish
            </h2>
            <p className="text-sm text-slate-600">
              Integrasi ke TikTok Content API melalui workflow n8n terpisah
              untuk retry dan observability.
            </p>
          </article>
        </div>

        <footer className="mt-6 glass-panel p-6 text-sm text-slate-600">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p>
              For production use, ensure API keys and secrets are configured in
              your environment.
            </p>
            <div className="flex items-center gap-4">
              <Link href="/terms" className="underline">
                Terms of Service
              </Link>
              <Link href="/privacy" className="underline">
                Privacy Policy
              </Link>
            </div>
          </div>
        </footer>
      </section>
    </main>
  );
}
