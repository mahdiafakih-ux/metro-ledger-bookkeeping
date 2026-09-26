import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const COOKIE_NAME = "notare_admin_session";
const PUBLIC_ADMIN_PATHS = ["/admin/login"];

async function isValidSession(token: string | undefined) {
  if (!token) return false;
  const secret = process.env.AUTH_SECRET;
  if (!secret) return false;
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret));
    // Must be an admin token — a client-portal token signed with the same
    // secret is rejected (mirrors isAdminTokenPayload in lib/auth.ts, which
    // can't be imported here because it pulls in server-only modules).
    if ("clientId" in payload || typeof payload.userId !== "string") return false;
    const aud = payload.aud;
    return aud === undefined || aud === "notare:admin" || (Array.isArray(aud) && aud.includes("notare:admin"));
  } catch {
    return false;
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtectedApi = pathname.startsWith("/api/export");
  const isAdminArea = pathname.startsWith("/admin");

  if (!isAdminArea && !isProtectedApi) return NextResponse.next();
  if (PUBLIC_ADMIN_PATHS.some((p: any) => pathname.startsWith(p))) return NextResponse.next();

  const token = request.cookies.get(COOKIE_NAME)?.value;
  const valid = await isValidSession(token);

  if (!valid) {
    if (isProtectedApi) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const loginUrl = new URL("/admin/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/export/:path*"],
};
