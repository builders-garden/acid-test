import { NextRequest, NextResponse } from "next/server";
import * as jose from "jose";
import { env } from "@/lib/env";
import { createAppClient, viemConnector } from "@farcaster/auth-client";

const appClient = createAppClient({
  relay: "https://relay.farcaster.xyz",
  ethereum: viemConnector({
    rpcUrls: [
      "https://mainnet.optimism.io",
      "https://1rpc.io/op",
      "https://optimism-rpc.publicnode.com",
      "https://optimism.drpc.org",
    ],
  }),
});

export const POST = async (req: NextRequest) => {
  let { nonce, signature, message } = await req.json();

  // Verify signature matches custody address and auth address
  const { data, success, fid } = await appClient.verifySignInMessage({
    domain: new URL(env.NEXT_PUBLIC_URL).hostname,
    nonce,
    message,
    signature,
    acceptAuthAddress: true,
  });
  let isValidSignature = success;

  if (!isValidSignature) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  // Generate JWT token
  const secret = new TextEncoder().encode(env.JWT_SECRET);
  const token = await new jose.SignJWT({
    fid,
    walletAddress: data.address,
    timestamp: Date.now(),
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30 days")
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
