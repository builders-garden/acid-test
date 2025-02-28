import { NextRequest, NextResponse } from "next/server";
import * as jose from "jose";
import { env } from "@/lib/env";

export async function GET(request: NextRequest) {
  const token = request.cookies.get("auth_token")?.value;

  if (!token) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 }
    );
  }

  try {
    const secret = new TextEncoder().encode(env.JWT_SECRET);
    const { payload } = await jose.jwtVerify(token, secret);

    return NextResponse.json({
      authenticated: true,
      user: {
        fid: payload.fid,
        walletAddress: payload.walletAddress,
      },
    });
  } catch (error) {
    console.error("Token verification failed:", error);
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }
}
