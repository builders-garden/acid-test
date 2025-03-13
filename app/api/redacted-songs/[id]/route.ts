import { prisma } from "@/lib/prisma/client";
import { NextResponse } from "next/server";

interface Params {
  params: {
    id: string;
  };
}

export async function GET(request: Request, { params }: Params) {
  try {
    const tokenId = params.id;

    if (!tokenId) {
      return NextResponse.json({ error: "Invalid token ID" }, { status: 400 });
    }

    const song = await prisma.song.findUnique({
      where: { cid: tokenId },
    });

    if (!song || !song.isRedactedUntil) {
      // If no song found with this ID or it's not redacted, return empty object
      return NextResponse.json({});
    }

    // Return redacted song in the expected format
    return NextResponse.json({
      tokenId: parseInt(song.cid),
      redactedUntil: Math.floor(song.isRedactedUntil.getTime() / 1000),
      title: song.cid, // Using cid as title placeholder
    });
  } catch (error) {
    console.error("Error fetching redacted song:", error);
    return NextResponse.json(
      { error: "Failed to fetch redacted song" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
