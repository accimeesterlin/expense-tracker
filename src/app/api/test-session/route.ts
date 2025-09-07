import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    console.log("Test session:", session);

    return NextResponse.json({
      session: session,
      hasSession: !!session,
      hasUser: !!session?.user,
      hasUserId: !!session?.user?.id,
    });
  } catch (error) {
    console.error("Session test error:", error);
    return NextResponse.json({ error: "Session test failed" }, { status: 500 });
  }
}
