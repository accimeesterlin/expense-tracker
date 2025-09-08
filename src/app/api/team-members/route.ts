import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import TeamMember from "@/models/TeamMember";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const teamMembers = await TeamMember.find({ userId: session.user.id })
      .populate("company", "name industry")
      .sort({ createdAt: -1 });
    return NextResponse.json(teamMembers);
  } catch (error) {
    console.error("Error fetching team members:", error);
    return NextResponse.json(
      { error: "Failed to fetch team members" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const body = await request.json();

    const teamMember = new TeamMember({
      ...body,
      userId: session.user.id,
    });
    await teamMember.save();

    const populatedMember = await TeamMember.findById(teamMember._id)
      .populate("company", "name industry");

    return NextResponse.json(populatedMember, { status: 201 });
  } catch (error: unknown) {
    console.error("Error creating team member:", error);

    if (error && typeof error === "object" && "name" in error && error.name === "ValidationError") {
      const mongooseError = error as Error & { errors: Record<string, { message: string }> };
      const validationErrors = Object.values(mongooseError.errors).map(
        (err) => err.message
      );
      return NextResponse.json(
        { error: "Validation failed", details: validationErrors },
        { status: 400 }
      );
    }

    if (error && typeof error === "object" && "code" in error && error.code === 11000) {
      return NextResponse.json(
        { error: "Team member with this email already exists for this company" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create team member" },
      { status: 500 }
    );
  }
}