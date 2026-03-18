import { NextResponse } from "next/server";

import { createSessionToken, SESSION_COOKIE_NAME } from "@/lib/auth";
import { supabasePasswordLogin } from "@/lib/supabase-auth";

type LoginBody = {
  email?: string;
  password?: string;
};

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json().catch(() => ({}))) as LoginBody;
  const email = (body.email ?? "").trim().toLowerCase();
  const password = body.password ?? "";

  const expectedEmail = (process.env.AUTH_ADMIN_EMAIL ?? "")
    .trim()
    .toLowerCase();
  const expectedPassword = process.env.AUTH_ADMIN_PASSWORD ?? "";

  if (!email || !password) {
    return NextResponse.json(
      { detail: "Email and password are required" },
      { status: 400 },
    );
  }

  let authenticated = false;
  let authError = "Invalid credentials";

  if (
    expectedEmail &&
    expectedPassword &&
    email === expectedEmail &&
    password === expectedPassword
  ) {
    authenticated = true;
  } else {
    const supabaseAuth = await supabasePasswordLogin(email, password);
    authenticated = supabaseAuth.ok;
    if (!supabaseAuth.ok && supabaseAuth.detail) {
      authError = supabaseAuth.detail;
    }
  }

  if (!authenticated) {
    return NextResponse.json({ detail: authError }, { status: 401 });
  }

  const token = createSessionToken(email);
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24,
  });
  return response;
}
