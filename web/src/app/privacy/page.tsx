export default function PrivacyPage() {
  return (
    <main className="mx-auto min-h-screen w-full max-w-4xl px-6 py-10 md:px-10">
      <section className="glass-panel p-6 md:p-8">
        <h1 className="mb-4 text-3xl font-bold text-slate-900">
          Privacy Policy
        </h1>
        <p className="mb-4 text-sm text-slate-600">Last updated: 2026-03-19</p>
        <div className="space-y-4 text-sm leading-7 text-slate-700">
          <p>
            Kami menyimpan data minimum untuk menjalankan pipeline: input
            keyword, URL video, metadata job, status render, dan URL hasil
            output.
          </p>
          <p>
            Credential sensitif (API key, token, secret) harus disimpan pada
            environment variable/secret manager dan tidak ditulis langsung di
            source code.
          </p>
          <p>
            Data operasional dapat dibagikan ke layanan pihak ketiga sesuai
            workflow (Supabase, TikTok API, Google Sheets, n8n) hanya untuk
            kebutuhan pemrosesan.
          </p>
        </div>
      </section>
    </main>
  );
}
