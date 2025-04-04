import { getState, updateState } from "@/lib/prisma/queries";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  try {
    const state = await getState();
    return NextResponse.json(state);
  } catch (error) {
    console.error("Error getting state:", error);
    return NextResponse.json({ error: "Failed to get state" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { isPrelaunch } = body;

    if (typeof isPrelaunch !== "boolean") {
      return NextResponse.json(
        { error: "Invalid isPrelaunch value" },
        { status: 400 }
      );
    }

    const state = await updateState(isPrelaunch);
    return NextResponse.json(state);
  } catch (error) {
    console.error("Error updating state:", error);
    return NextResponse.json(
      { error: "Failed to update state" },
      { status: 500 }
    );
  }
}
