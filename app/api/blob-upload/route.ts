import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname: string) => {
        // In production, you should add authentication here
        return {
          allowedContentTypes: [
            "audio/wav",
            "audio/x-aiff",
            "audio/flac",
            "audio/alac",
            "audio/aac",
            "audio/ogg",
            "audio/mpeg",
            "image/jpeg",
            "image/png",
            "image/gif",
            "image/webp",
          ],
          maximumSizeInBytes: 500 * 1024 * 1024, // 500MB max
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        // This won't run locally, only in production
        console.log("Blob upload completed:", blob);
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 }
    );
  }
}
