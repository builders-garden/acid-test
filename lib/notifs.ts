import {
  SendNotificationRequest,
  sendNotificationResponseSchema,
} from "@farcaster/frame-sdk";
import { env } from "./env";
import { getUsersNotificationDetails } from "./prisma/queries";

const appUrl = env.NEXT_PUBLIC_URL || "";

type SendFrameNotificationResult =
  | {
      state: "error";
      error: unknown;
    }
  | { state: "no_token" }
  | { state: "rate_limit" }
  | { state: "success" };

export async function sendFrameNotification({
  fids,
  title,
  body,
}: {
  fids: number[];
  title: string;
  body: string;
}): Promise<SendFrameNotificationResult> {
  // Process fids in batches of 100
  const batchSize = 100;
  let finalResult: SendFrameNotificationResult = { state: "success" };

  for (let i = 0; i < fids.length; i += batchSize) {
    const batchFids = fids.slice(i, i + batchSize);

    // Add delay between batches, except for the first one
    if (i > 0) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    const result = await sendBatchNotification(batchFids, title, body);

    // Keep track of the most significant error state
    if (result.state === "error") {
      finalResult = result;
    } else if (result.state === "rate_limit" && finalResult.state !== "error") {
      finalResult = result;
    } else if (
      result.state === "no_token" &&
      finalResult.state !== "error" &&
      finalResult.state !== "rate_limit"
    ) {
      finalResult = result;
    }
  }

  return finalResult;
}

async function sendBatchNotification(
  fids: number[],
  title: string,
  body: string
): Promise<SendFrameNotificationResult> {
  const notificationDetails = await getUsersNotificationDetails(fids);

  if (!notificationDetails.length) {
    return { state: "no_token" };
  }

  // the url is the same for all users
  const response = await fetch(notificationDetails[0].url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      notificationId: crypto.randomUUID(),
      title,
      body,
      targetUrl: appUrl,
      tokens: notificationDetails.map((detail) => detail.token),
    } satisfies SendNotificationRequest),
  });

  const responseJson = await response.json();

  if (response.status === 200) {
    const responseBody = sendNotificationResponseSchema.safeParse(responseJson);
    if (responseBody.success === false) {
      // Malformed response
      return { state: "error", error: responseBody.error.errors };
    }

    if (responseBody.data.result.rateLimitedTokens.length) {
      // Rate limited
      return { state: "rate_limit" };
    }

    return { state: "success" };
  } else {
    // Error response
    return { state: "error", error: responseJson };
  }
}
