// Handler : POST /api/admin/logout — détruit la session admin côté navigateur
// (le cookie signé est remplacé par un cookie vide immédiatement expiré).
import { NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/backend/lib/session";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0, // suppression immédiate
    secure: process.env.NODE_ENV === "production",
  });
  // La réponse elle-même ne doit jamais être mise en cache
  res.headers.set("Cache-Control", "no-store");
  return res;
}
