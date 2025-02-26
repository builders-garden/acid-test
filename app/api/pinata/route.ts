import { NextResponse, type NextRequest } from "next/server";
import { pinata } from "../../../lib/pinata";

export async function POST(request: NextRequest) {
  try {
    const data = await request.formData();
    
    // Check what type of request this is
    const requestType = data.get("type") as string;
    
    // Handle combined upload request (both audio and image)
    if (requestType === "combined") {
      const audioFile: File | null = data.get("audioFile") as unknown as File;
      const imageFile: File | null = data.get("imageFile") as unknown as File;
      const title = data.get("title") as string;
      const description = data.get("description") || "Acid test hit";
      
      // Validate files
      if (!audioFile || !imageFile) {
        return NextResponse.json(
          { error: "Both audio and image files are required" },
          { status: 400 }
        );
      }
      
      // Upload audio file
      const audioUploadData = await pinata.upload.file(audioFile);
      const audioCID = audioUploadData.IpfsHash;
      const audioUrl = `https://gateway.pinata.cloud/ipfs/${audioCID}`;
      
      // Upload image file
      const imageUploadData = await pinata.upload.file(imageFile);
      const imageCID = imageUploadData.IpfsHash;
      const imageUrl = `https://gateway.pinata.cloud/ipfs/${imageCID}`;
      
      // Create metadata JSON
      const metadata = {
        name: title,
        image: imageUrl,
        animation_url: audioUrl,
        description: description,
      };
      
      // Convert metadata to file and upload
      const metadataBlob = new Blob([JSON.stringify(metadata)], { 
        type: "application/json" 
      });
      const metadataFile = new File([metadataBlob], "metadata.json", { 
        type: "application/json" 
      });
      
      const metadataUploadData = await pinata.upload.file(metadataFile);
      const metadataCID = metadataUploadData.IpfsHash;
      const metadataUrl = `https://gateway.pinata.cloud/ipfs/${metadataCID}`;
      
      // Return all URLs to the client
      return NextResponse.json({
        audioUrl,
        imageUrl,
        metadataUrl,
        audioCID,
        imageCID,
        metadataCID
      }, { status: 200 });
    } 
    // Handle single file upload (original functionality)
    else {
      const file: File | null = data.get("file") as unknown as File;
      
      // Ensure the file is valid
      if (!file) {
        return NextResponse.json({ error: "No file provided" }, { status: 400 });
      }
      
      const uploadData = await pinata.upload.file(file);
      const url = `https://gateway.pinata.cloud/ipfs/${uploadData.IpfsHash}`;
      return NextResponse.json({ url }, { status: 200 });
    }
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}