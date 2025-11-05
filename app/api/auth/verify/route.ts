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

    // Validate that the token contains a valid fid
    if (!payload.fid || payload.fid === undefined) {
      console.error("Token missing valid fid:", payload);
      return NextResponse.json(
        { error: "Invalid token - missing fid" },
        { status: 401 }
      );
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        fid: payload.fid,
        walletAddress: payload.walletAddress,
      },
      token,
    });
  } catch (error) {
    console.error("Token verification failed:", error);
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }
}
