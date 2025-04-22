import { prisma } from "@/lib/prisma/client";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    // Find the oldest redacted song
    const oldestRedactedSong = await prisma.redactedSong.findFirst({
      orderBy: {
        createdAt: "asc",
      },
    });

    if (!oldestRedactedSong) {
      return NextResponse.json(
        { error: "No redacted songs available to unveil" },
        { status: 200 }
      );
    }

    // Delete the oldest redacted song
    await prisma.redactedSong.delete({
      where: { id: oldestRedactedSong.id },
    });

    return NextResponse.json({
      success: true,
      message: `Unveiled redacted song with ID: ${oldestRedactedSong.id}`,
    });
  } catch (error) {
    console.error("Error unveiling redacted song:", error);
    return NextResponse.json(
      { error: "Failed to unveil redacted song" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
