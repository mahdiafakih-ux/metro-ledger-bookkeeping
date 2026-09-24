import { NextRequest, NextResponse } from "next/server";
import { verifySessionTokenOfType } from "@/lib/session-tokens";

const COOKIE_NAME = "notare_admin_session";
const PUBLIC_ADMIN_PATHS = ["/admin/login"];

// Admin area only accepts admin-typed sessions. A client-portal token signed
// with the same secret fails the audience/type check here.
async function isValidSession(token: string | undefined) {
  return (await verifySessionTokenOfType("admin", token)) !== null;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtectedApi = pathname.startsWith("/api/export");
  const isAdminArea = pathname.startsWith("/admin");

  if (!isAdminArea && !isProtectedApi) return NextResponse.next();
  if (PUBLIC_ADMIN_PATHS.some((p) => pathname.startsWith(p))) return NextResponse.next();

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
