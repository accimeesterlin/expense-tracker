import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import Goal from "@/models/Goal";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();
    
    const goals = await Goal.find({ 
      userId: session.user.email,
      isActive: true
    }).sort({ priority: -1, targetDate: 1 });
    
    return NextResponse.json(goals);
  } catch (error) {
    console.error("Error fetching goals:", error);
    return NextResponse.json(
      { error: "Failed to fetch goals" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await request.json();
    await connectToDatabase();

    const goal = new Goal({
      userId: session.user.email,
      ...data,
    });

    await goal.save();
    return NextResponse.json(goal, { status: 201 });
  } catch (error: unknown) {
    console.error("Error creating goal:", error);
    if (error && typeof error === "object" && "name" in error && error.name === "ValidationError") {
      const mongooseError = error as Error & { message: string };
      return NextResponse.json(
        { error: mongooseError.message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to create goal" },
      { status: 500 }
    );
  }
}