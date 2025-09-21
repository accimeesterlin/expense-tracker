import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import TeamMember from "@/models/TeamMember";
import TeamInvite from "@/models/TeamInvite";
import Company from "@/models/Company";
import { getUserCompanyIds } from "@/lib/permissions";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const { id } = await params;
    
    // Get companies the user has access to (owns or is member of)
    const accessibleCompanyIds = await getUserCompanyIds(session.user.id);
    
    // Find team member that belongs to companies we have access to
    const teamMember = await TeamMember.findOne({ 
      _id: id, 
      company: { $in: accessibleCompanyIds }
    }).populate("company", "name industry");

    if (!teamMember) {
      return NextResponse.json({ error: "Team member not found" }, { status: 404 });
    }

    return NextResponse.json(teamMember);
  } catch (error) {
    console.error("Error fetching team member:", error);
    return NextResponse.json(
      { error: "Failed to fetch team member" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const { id } = await params;
    const body = await request.json();

    // Get companies owned by the user (only owners can update team members)
    const ownedCompanies = await Company.find({ userId: session.user.id });
    const ownedCompanyIds = ownedCompanies.map(c => c._id.toString());

    const teamMember = await TeamMember.findOneAndUpdate(
      { _id: id, company: { $in: ownedCompanyIds } },
      body,
      {
        new: true,
        runValidators: true,
      }
    ).populate("company", "name industry");

    if (!teamMember) {
      return NextResponse.json({ error: "Team member not found or you don't have permission to edit" }, { status: 404 });
    }

    return NextResponse.json(teamMember);
  } catch (error: unknown) {
    console.error("Error updating team member:", error);

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
      { error: "Failed to update team member" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const { id } = await params;
    
    // Get companies owned by the user (only owners can delete team members)
    const ownedCompanies = await Company.find({ userId: session.user.id });
    const ownedCompanyIds = ownedCompanies.map(c => c._id.toString());
    
    const teamMember = await TeamMember.findOneAndDelete({
      _id: id,
      company: { $in: ownedCompanyIds }
    });

    if (!teamMember) {
      return NextResponse.json({ error: "Team member not found or you don't have permission to delete" }, { status: 404 });
    }

    // Also delete any pending team invites for this email and company
    await TeamInvite.deleteMany({
      email: teamMember.email,
      companyId: teamMember.company,
      isAccepted: false
    });

    return NextResponse.json({ message: "Team member deleted successfully" });
  } catch (error) {
    console.error("Error deleting team member:", error);
    return NextResponse.json(
      { error: "Failed to delete team member" },
      { status: 500 }
    );
  }
}