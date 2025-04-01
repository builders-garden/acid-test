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
    const differenceInSeconds = endTimeInSeconds - startTimeInSeconds;

    // Format token ID consistently
    const formattedTokenId = tokenId.toString().padStart(3, "0");
    const tokenIdNumeric = Number(tokenId);

    // Calculate time until key events
    const timeUntilStart = startTimeInSeconds - currentTimeInSeconds;
    const timeUntilEnd = endTimeInSeconds - currentTimeInSeconds;
    const oneHourInSeconds = 60 * 60;
    const oneDayInSeconds = 24 * oneHourInSeconds;
    const thirtyMinutesInSeconds = 30 * 60;

    // Generate human-readable duration text
    let durationText;
    if (differenceInSeconds <= oneDayInSeconds) {
      const hours = Math.round(differenceInSeconds / oneHourInSeconds);
      durationText = `${hours} hour${hours !== 1 ? "s" : ""}`;
    } else {
      const days = Math.round(differenceInSeconds / oneDayInSeconds);
      durationText = `${days} day${days !== 1 ? "s" : ""}`;
    }

    // Format date for display (TODO: implement proper formatting)
    const formattedStartDate = new Date(
      startTimeInSeconds * 1000
    ).toLocaleString();

    await Promise.all([
      // When song goes live
      sendDelayedNotificationToAll(
        `${title} (AT${formattedTokenId}) is live now!`,
        `Mint is open for ${durationText}. Grab yours and climb the leaderboard.`,
        timeUntilStart
      ),

      // 24 hours before song goes live
      sendDelayedNotificationToAll(
        "Our debut song goes live tomorrow",
        `Editions are ${price}. You can checkout in ETH or USDC. See you tomorrow at ${formattedStartDate}.`,
        timeUntilStart - oneDayInSeconds
      ),

      // 1 hour before song goes live
      sendDelayedNotificationToAll(
        "1 hour til' AT debut!",
        `${title} (AT${formattedTokenId}). Live in 1 hour on Acid Test.`,
        timeUntilStart - oneHourInSeconds
      ),

      // When mint window closes
      sendDelayedNotificationToAll(
        `The AT${formattedTokenId} mint has officially closed.`,
        `The secondary market is now live`,
        timeUntilEnd
      ),

      // 24 hours after mint ends
      sendDelayedNotificationBasedOnOwnership(
        `Acid Test ${formattedTokenId} debuted yesterday!`,
        `The secondary market is now live.`,
        tokenIdNumeric,
        timeUntilEnd + oneDayInSeconds
      ),

      // 30 minutes before mint closes (non-owners)
      sendDelayedNotificationBasedOnOwnership(
        `30 minutes left til' mint closes`,
        `Mint "${title}" and climb the leaderboard before time runs out`,
        tokenIdNumeric,
        timeUntilEnd - thirtyMinutesInSeconds
      ),

      // 30 minutes before mint closes (owners)
      sendDelayedNotificationBasedOnOwnership(
        `30 minutes left til' mint closes`,
        `You currently hold the 15th spot on the collectors leaderboard`,
        tokenIdNumeric,
        timeUntilEnd - thirtyMinutesInSeconds
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
