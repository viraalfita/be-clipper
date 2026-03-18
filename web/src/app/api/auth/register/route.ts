import { NextResponse } from "next/server";

import { createSessionToken, SESSION_COOKIE_NAME } from "@/lib/auth";
import { isRegistrationEnabled, supabaseRegister } from "@/lib/supabase-auth";

type RegisterBody = {
  email?: string;
  password?: string;
  registrationToken?: string;
};

export async function POST(request: Request): Promise<NextResponse> {
  if (!isRegistrationEnabled()) {
    return NextResponse.json(
      { detail: "Registration is disabled" },
      { status: 403 },
    );
  }

  const body = (await request.json().catch(() => ({}))) as RegisterBody;
  const email = (body.email ?? "").trim().toLowerCase();
  const password = body.password ?? "";
  const registrationToken = body.registrationToken ?? "";

  if (!email || !password) {
    return NextResponse.json(
      { detail: "Email and password are required" },
      { status: 400 },
    );
  }
  if (password.length < 8) {
    return NextResponse.json(
      { detail: "Password must be at least 8 characters" },
      { status: 400 },
    );
  }

  const expectedToken = process.env.AUTH_REGISTRATION_TOKEN;
  if (expectedToken && registrationToken !== expectedToken) {
    return NextResponse.json(
      { detail: "Invalid registration token" },
      { status: 401 },
    );
  }

  const result = await supabaseRegister(email, password);
  if (!result.ok) {
    return NextResponse.json(
      { detail: result.detail ?? "Registration failed" },
      { status: 400 },
    );
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
