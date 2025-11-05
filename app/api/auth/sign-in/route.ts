import { NextRequest, NextResponse } from "next/server";
import * as jose from "jose";
import { env } from "@/lib/env";
import { createAppClient, viemConnector } from "@farcaster/auth-client";
import { verifyMessage } from "viem";

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
  let { nonce, signature, message, walletAddress } = await req.json();

  let fid: number | undefined;
  let address: string | undefined;
  let isValidSignature = false;

  try {
    // Try to verify as a SIWE message (from Frame SDK signIn)
    // Parse the SIWE message to extract the address and fid
    const addressMatch = message.match(/0x[a-fA-F0-9]{40}/);
    const fidMatch = message.match(/fid:\s*(\d+)/);

    if (addressMatch) {
      const recoveredAddress = addressMatch[0];

      // Verify the signature matches the message
      const isValid = await verifyMessage({
        address: recoveredAddress as `0x${string}`,
        message,
        signature,
      });

      if (isValid) {
        isValidSignature = true;
        address = recoveredAddress;

        // Extract FID from the message if present
        if (fidMatch) {
          fid = parseInt(fidMatch[1], 10);
        }
      }
    }
  } catch (error) {
    console.error("SIWE verification failed:", error);
  }

  // If SIWE verification failed, try Farcaster auth client format
  if (!isValidSignature) {
    try {
      const {
        data,
        success,
        fid: fcFid,
      } = await appClient.verifySignInMessage({
        domain: new URL(env.NEXT_PUBLIC_URL).hostname,
        nonce,
        message,
        signature,
        acceptAuthAddress: true,
      });

      if (success) {
        isValidSignature = true;
        fid = fcFid;
        address = data.address;
      }
    } catch (fcError) {
      console.error("Farcaster verification also failed:", fcError);
    }
  }

  if (!isValidSignature) {
    console.error("Both verification methods failed");
    console.error("Message:", message);
    console.error("Signature:", signature);
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  // Generate JWT token
  const secret = new TextEncoder().encode(env.JWT_SECRET);
  const token = await new jose.SignJWT({
    fid,
    walletAddress: address || walletAddress,
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
