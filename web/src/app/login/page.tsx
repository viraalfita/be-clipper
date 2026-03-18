"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorText, setErrorText] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setErrorText("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const body = (await response.json().catch(() => ({}))) as {
        detail?: string;
      };
      if (!response.ok) {
        throw new Error(body.detail ?? "Login failed");
      }
      router.replace("/dashboard");
      router.refresh();
    } catch (error) {
      setErrorText(
        error instanceof Error ? error.message : "Unexpected login error",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden px-6 py-12 md:px-10">
      <div className="aurora left-[-100px] top-[-90px]" />
      <div className="aurora right-[-120px] top-[55%]" />

      <section className="mx-auto w-full max-w-md">
        <div className="glass-panel p-7 md:p-8">
          <p className="mono mb-3 text-xs uppercase tracking-[0.2em] text-slate-500">
            Autoclipper Studio
          </p>
          <h1 className="mb-2 text-2xl font-bold text-slate-900">Sign in</h1>
          <p className="mb-6 text-sm text-slate-600">
            Masuk untuk mengakses dashboard dan menjalankan workflow produksi.
          </p>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <label className="block text-sm font-medium text-slate-700">
              Email
              <input
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-900 outline-none transition focus:border-cyan-400"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </label>

            <label className="block text-sm font-medium text-slate-700">
              Password
              <input
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-900 outline-none transition focus:border-cyan-400"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </label>

            {errorText ? (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                {errorText}
              </div>
            ) : null}

            <button
              className="inline-flex w-full items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400"
              type="submit"
              disabled={submitting}
            >
              {submitting ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <div className="mt-6 space-y-2 text-center text-xs text-slate-500">
            <p>
              Dengan login kamu menyetujui{" "}
              <Link href="/terms" className="underline">
                Terms of Service
              </Link>{" "}
              dan{" "}
              <Link href="/privacy" className="underline">
                Privacy Policy
              </Link>
              .
            </p>
            <p>
              Belum punya akun?{" "}
              <Link href="/register" className="underline">
                Register
              </Link>
            </p>
            <p>
              <Link href="/" className="underline">
                Back to landing page
              </Link>
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
