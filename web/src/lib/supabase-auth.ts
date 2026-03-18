type SupabaseAuthResult = {
  ok: boolean;
  detail?: string;
};

function getSupabaseAuthConfig(): { url: string; anonKey: string } {
  const url = (process.env.AUTH_SUPABASE_URL ?? "").trim();
  const anonKey = (process.env.AUTH_SUPABASE_ANON_KEY ?? "").trim();
  if (!url || !anonKey) {
    throw new Error("Supabase auth is not configured");
  }
  return { url, anonKey };
}

export async function supabasePasswordLogin(
  email: string,
  password: string,
): Promise<SupabaseAuthResult> {
  try {
    const { url, anonKey } = getSupabaseAuthConfig();
    const response = await fetch(`${url}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
      cache: "no-store",
    });

    const body = (await response.json().catch(() => ({}))) as {
      error_description?: string;
      msg?: string;
    };
    if (!response.ok) {
      return {
        ok: false,
        detail: body.error_description ?? body.msg ?? "Invalid credentials",
      };
    }
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      detail:
        error instanceof Error
          ? error.message
          : "Unable to reach auth provider",
    };
  }
}

export async function supabaseRegister(
  email: string,
  password: string,
): Promise<SupabaseAuthResult> {
  try {
    const { url, anonKey } = getSupabaseAuthConfig();
    const response = await fetch(`${url}/auth/v1/signup`, {
      method: "POST",
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
      cache: "no-store",
    });

    const body = (await response.json().catch(() => ({}))) as {
      msg?: string;
      error_description?: string;
    };
    if (!response.ok) {
      return {
        ok: false,
        detail: body.msg ?? body.error_description ?? "Registration failed",
      };
    }

    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      detail:
        error instanceof Error
          ? error.message
          : "Unable to reach auth provider",
    };
  }
}

export function isRegistrationEnabled(): boolean {
  return (
    (process.env.AUTH_ENABLE_REGISTRATION ?? "false").toLowerCase() === "true"
  );
}
