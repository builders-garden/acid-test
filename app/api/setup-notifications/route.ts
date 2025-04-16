import { NextResponse, type NextRequest } from "next/server";
import {
  sendDelayedNotificationToAll,
  sendDelayedNotificationBasedOnOwnership,
} from "@/lib/qstash";
import { z } from "zod";

const requestSchema = z.object({
  title: z.string().min(1, "Title is required"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  price: z.string().min(1, "Price is required"),
  tokenId: z.string().min(1, "TokenId is required"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validationResult = requestSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Invalid request data",
          details: validationResult.error.format(),
        },
        { status: 400 }
      );
    }

    const { title, startDate, endDate, price, tokenId } = validationResult.data;

    // Convert timestamps and calculate time differences
    const currentTimeInSeconds = Date.now() / 1000;
    const startTimeInSeconds = Number(startDate);
    const endTimeInSeconds = Number(endDate);

    // Format token ID consistently
    const formattedTokenId = tokenId.padStart(3, "0");
    const tokenIdNumeric = Number(tokenId);

    // Calculate time until key events
    const timeUntilStart = startTimeInSeconds - currentTimeInSeconds;
    const timeUntilEnd = endTimeInSeconds - currentTimeInSeconds;
    const oneHourInSeconds = 60 * 60;
    const oneDayInSeconds = 24 * oneHourInSeconds;
    const twoDaysInSeconds = 2 * oneDayInSeconds;
    const thirtyMinutesInSeconds = 30 * 60;

    await Promise.all([
      // When song goes live
      sendDelayedNotificationToAll(
        `Acid Test Episode ${tokenId} is live!`,
        `We just released AT${formattedTokenId}: "${title}". Listen now!`,
        timeUntilStart
      ),

      // 30 minutes before mint ends
      sendDelayedNotificationToAll(
        `30 minutes left til' mint closes!`,
        `Last chance to mint Acid Test Episode ${tokenId}: "${title}".`,
        timeUntilEnd - thirtyMinutesInSeconds
      ),

      // 48 hours after mint ends (non-owners)
      sendDelayedNotificationBasedOnOwnership(
        `ICYMI: Acid Test Ep. ${tokenId} is out!`,
        `AT${formattedTokenId}: "${title}" is out now. Listen in the Acid Test Mini App!`,
        tokenIdNumeric,
        false,
        timeUntilEnd + twoDaysInSeconds
      ),
    ]);

    return NextResponse.json({
      message: "Notifications setup successfully",
      data: { title, tokenId, timestamp: new Date().toISOString() },
    });
  } catch (error) {
    console.error("Error setting up delayed notifications:", error);

    return NextResponse.json(
      {
        error: "Failed to setup notifications",
        message: (error as Error).message,
      },
      { status: 500 }
    );
  }
}
