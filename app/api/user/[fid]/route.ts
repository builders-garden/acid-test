import { getUser } from "@/lib/prisma/queries";
import { NextRequest } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ fid: string }> }
) {
  const { fid } = await params;

  if (!fid) {
    return Response.json({ error: "Missing fid parameter" }, { status: 400 });
  }

  try {
    const fidNumber = Number(fid);
    if (isNaN(fidNumber)) {
      return Response.json({ error: "Invalid fid format" }, { status: 400 });
    }

    const user = await getUser(fidNumber);

    if (!user) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    return Response.json({ user });
  } catch (error) {
    console.error("Database error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
