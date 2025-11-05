import {
  SendNotificationRequest,
  sendNotificationResponseSchema,
} from "@farcaster/miniapp-sdk";
import { env } from "./env";
import {
  getUsersNotificationDetails,
  UserMiniAppNotificationDetails,
} from "./prisma/queries";
import { createHash } from "crypto";

const appUrl = env.NEXT_PUBLIC_URL || "";

type SendMiniAppNotificationResult =
  | {
      state: "error";
      error: unknown;
    }
  | { state: "no_token" }
  | { state: "rate_limit" }
  | { state: "success" };

export async function sendMiniAppNotification({
  fids,
  title,
  body,
}: {
  fids: number[];
  title: string;
  body: string;
}): Promise<SendMiniAppNotificationResult> {
  // Process fids in batches of 100
  const batchSize = 100;
  let finalResult: SendMiniAppNotificationResult = { state: "success" };

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

// function sanitize(text: string): string {
//   // Remove special characters and emojis, keep alphanumeric and spaces
//   return text.replace(/[^\w\s]/gi, "").replace(/\s+/g, "-");
// }

async function sendBatchNotification(
  fids: number[],
  title: string,
  body: string
): Promise<SendMiniAppNotificationResult> {
  const allNotificationDetails = await getUsersNotificationDetails(fids);

  if (!allNotificationDetails.length) {
    return { state: "no_token" };
  }

  // Group details by URL to handle different notification services
  const detailsByUrl = new Map<
    string,
    Array<UserMiniAppNotificationDetails> // Updated type
  >();
  for (const detail of allNotificationDetails) {
    if (!detailsByUrl.has(detail.url)) {
      detailsByUrl.set(detail.url, []);
    }
    detailsByUrl.get(detail.url)!.push(detail);
  }

  let overallResultState: SendMiniAppNotificationResult = { state: "success" };

  // Convert Map entries to an array for iteration to avoid downlevelIteration issues
  for (const [url, specificNotificationDetails] of Array.from(
    detailsByUrl.entries()
  )) {
    if (specificNotificationDetails.length === 0) {
      continue;
    }

    const tokensForThisUrl = specificNotificationDetails.map(
      (detail) => detail.token // Keep this as is, only tokens are needed for the API
    );

    // Generate notificationId based on title and body combined
    const combinedText = `${title} ${body}`;
    let notificationId = createHash("sha256")
      .update(combinedText)
      .digest("hex")
      .substring(0, 128); // Use first 32 characters for a clean, consistent ID

    if (notificationId.length > 128) {
      notificationId = notificationId.substring(0, 128);
    }

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        notificationId,
        title,
        body,
        targetUrl: appUrl,
        tokens: tokensForThisUrl,
      } satisfies SendNotificationRequest),
    });

    const responseJson = await response.json();
    let currentGroupResult: SendMiniAppNotificationResult;

    if (response.status === 200) {
      const responseBody =
        sendNotificationResponseSchema.safeParse(responseJson);
      if (responseBody.success === false) {
        currentGroupResult = {
          state: "error",
          error: responseBody.error.errors,
        };
      } else {
        // Check if 'result' and 'rateLimitedTokens' exist, matching the original logic's expectation
        if (
          responseBody.data &&
          responseBody.data.result &&
          Array.isArray(responseBody.data.result.rateLimitedTokens) &&
          responseBody.data.result.rateLimitedTokens.length > 0
        ) {
          currentGroupResult = { state: "rate_limit" };
        } else {
          currentGroupResult = { state: "success" };
        }
      }
    } else {
      currentGroupResult = { state: "error", error: responseJson };
    }

    // Aggregate results: error > rate_limit > success
    if (currentGroupResult.state === "error") {
      if (overallResultState.state !== "error") {
        // Store the first error
        overallResultState = currentGroupResult;
      }
    } else if (
      currentGroupResult.state === "rate_limit" &&
      overallResultState.state !== "error"
    ) {
      overallResultState = currentGroupResult;
    } else if (currentGroupResult.state === "success") {
      // Only update to success if not already error or rate_limit
      if (
        overallResultState.state !== "error" &&
        overallResultState.state !== "rate_limit"
      ) {
        // overallResultState remains { state: "success" } or becomes it
      }
    }
  }

  return overallResultState;
}
