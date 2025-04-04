import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import * as jose from "jose";
import { verifyMessage } from "viem";
import { fetchUser } from "@/lib/neynar";
import { env } from "@/lib/env";

export const POST = async (req: NextRequest) => {
  let { fid, walletAddress, signature, message } = await req.json();

  // We don't have the user address in the Farcaster case
  if (!walletAddress) {
    const user = await fetchUser(fid);
    walletAddress = user.custody_address;
  }

  // Verify signature matches custody address
  const isValidSignature = await verifyMessage({
    address: walletAddress as `0x${string}`,
    message,
    signature,
  });

  if (!isValidSignature) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  // Generate JWT token
  const secret = new TextEncoder().encode(env.JWT_SECRET);
  const token = await new jose.SignJWT({ fid, walletAddress })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);

  // Create the response
  const response = NextResponse.json({ success: true, token });

  // Set the auth cookie with the JWT token
  response.cookies.set({
    name: "auth_token",
    value: token,
    httpOnly: true,
    secure: true,
    sameSite: "none",
    maxAge: 7 * 24 * 60 * 60, // 7 days
    path: "/",
  });

  return response;
};
