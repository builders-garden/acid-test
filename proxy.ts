import { NextRequest, NextResponse } from "next/server";
import * as jose from "jose";
import { env } from "./lib/env";
import { validateQstashRequest } from "./lib/qstash";

export const config = {
  matcher: ["/api/:path*"],
};

export default async function proxy(req: NextRequest) {
  // Skip auth check for sign-in and verify endpoints
  if (
    req.nextUrl.pathname === "/api/auth/sign-in" ||
    req.nextUrl.pathname === "/api/auth/verify" ||
    req.nextUrl.pathname.includes("/api/og") ||
    req.nextUrl.pathname.includes("/api/webhook")
  ) {
    return NextResponse.next();
  }

  if (req.nextUrl.pathname.includes("qstash")) {
    try {
      await validateQstashRequest(
        req.headers.get("Upstash-Signature")!,
        req.nextUrl.pathname
      );
    } catch (error) {
      if (error instanceof Error) {
        return NextResponse.json({ error: error.toString() }, { status: 401 });
      }
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.next();
  }

  // Get token from auth_token cookie
  const token = req.cookies.get("auth_token")?.value;

  if (!token) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 }
    );
  }

  try {
    const secret = new TextEncoder().encode(env.JWT_SECRET);
    // Verify the token using jose
    const { payload } = await jose.jwtVerify(token, secret);

    // Clone the request headers to add user info
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set("x-user-fid", payload.fid as string);

    // Return response with modified headers
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }
}
