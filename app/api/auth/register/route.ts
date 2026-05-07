import { NextRequest, NextResponse } from "next/server";
import { registerUserInDb } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, email, password, publicKey } = body;

    if (!username || !email || !password || !publicKey) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const result = registerUserInDb(username, email, password, publicKey);
    if (!result) {
      return NextResponse.json(
        { error: "User already exists" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        token: result.token,
        user: result.user,
      },
      { status: 201 }
    );
  } catch (error) {
    const isSyntaxError = error instanceof Error && /JSON/.test(error.message);
    console.error("Register error:", error);

    if (isSyntaxError) {
      return NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
