import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { DashboardClient } from "@/components/dashboard-client";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/auth";

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const session = verifySessionToken(token);

  if (!session) {
    redirect("/login");
  }

  return <DashboardClient userEmail={session.email} />;
}
