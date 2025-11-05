import { NextResponse, type NextRequest } from "next/server";
import { pinata } from "../../../lib/pinata";
import { env } from "../../../lib/env";

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get("content-type") || "";

    // Handle JSON requests with Blob URLs
    if (contentType.includes("application/json")) {
      const data = await request.json();
      const requestType = data.type;

      if (requestType === "combined") {
        const audioFileUrl = data.audioFileUrl;
        const imageFileUrl = data.imageFileUrl;
        const title = data.title;
        const description = data.description || "";

        if (!audioFileUrl || !imageFileUrl) {
          return NextResponse.json(
            { error: "Both audio and image URLs are required" },
            { status: 400 }
          );
        }

        // Download files from Blob URLs
        const audioResponse = await fetch(audioFileUrl);
        const imageResponse = await fetch(imageFileUrl);

        if (!audioResponse.ok || !imageResponse.ok) {
          return NextResponse.json(
            { error: "Failed to download files from Blob storage" },
            { status: 500 }
          );
        }

        const audioBlob = await audioResponse.blob();
        const imageBlob = await imageResponse.blob();

        const audioFile = new File([audioBlob], "audio.mp3", {
          type: audioBlob.type,
        });
        const imageFile = new File([imageBlob], "image.png", {
          type: imageBlob.type,
        });

        // Upload audio file to Pinata
        const audioUploadData = await pinata.upload.file(audioFile);
        const audioCID = audioUploadData.IpfsHash;
        const audioUrl = `https://${env.NEXT_PUBLIC_GATEWAY_URL}/ipfs/${audioCID}`;

        // Upload image file to Pinata
        const imageUploadData = await pinata.upload.file(imageFile);
        const imageCID = imageUploadData.IpfsHash;
        const imageUrl = `https://${env.NEXT_PUBLIC_GATEWAY_URL}/ipfs/${imageCID}`;

        // Create metadata JSON
        const metadata = {
          name: title,
          image: imageUrl,
          animation_url: audioUrl,
          description: description,
        };

        // Upload metadata
        const metadataBlob = new Blob([JSON.stringify(metadata)], {
          type: "application/json",
        });
        const metadataFile = new File([metadataBlob], "metadata.json", {
          type: "application/json",
        });

        const metadataUploadData = await pinata.upload.file(metadataFile);
        const metadataCID = metadataUploadData.IpfsHash;
        const metadataUrl = `https://${env.NEXT_PUBLIC_GATEWAY_URL}/ipfs/${metadataCID}`;

        return NextResponse.json(
          {
            audioUrl,
            imageUrl,
            metadataUrl,
            audioCID,
            imageCID,
            metadataCID,
          },
          { status: 200 }
        );
      }
      return NextResponse.json(
        { error: "Invalid request type" },
        { status: 400 }
      );
    } else {
      return NextResponse.json(
        { error: "Invalid content type" },
        { status: 400 }
      );
    }
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
