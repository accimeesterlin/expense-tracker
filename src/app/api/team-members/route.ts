import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import TeamMember from "@/models/TeamMember";
import TeamInvite from "@/models/TeamInvite";
import Company from "@/models/Company";
import { logAuditEvent } from "@/lib/audit";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    
    // Get companies owned by the user
    const ownedCompanies = await Company.find({ userId: session.user.id });
    const ownedCompanyIds = ownedCompanies.map(c => c._id.toString());
    
    // Get actual team members for owned companies
    const teamMembers = await TeamMember.find({ 
      company: { $in: ownedCompanyIds }
    })
      .populate("company", "name industry")
      .sort({ createdAt: -1 });
    
    // Get pending invites for owned companies
    const pendingInvites = await TeamInvite.find({
      inviterId: session.user.id,
      isAccepted: false,
      expiresAt: { $gt: new Date() }
    })
      .populate("companyId", "name industry")
      .sort({ createdAt: -1 });
    
    // Format pending invites to match team member structure
    const formattedInvites = pendingInvites.map(invite => ({
      _id: invite._id,
      name: "Pending Invitation",
      email: invite.email,
      role: invite.role,
      department: invite.department,
      phone: invite.phone,
      isActive: false,
      isPending: true,
      company: invite.companyId,
      permissions: invite.permissions,
      createdAt: invite.createdAt,
      updatedAt: invite.updatedAt,
      expiresAt: invite.expiresAt
    }));
    
    // Combine team members and pending invites
    const allMembers = [...teamMembers, ...formattedInvites];
    
    return NextResponse.json(allMembers);
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

    const {
      name,
      email,
      role,
      department,
      phone,
      company,
      isActive,
      permissions,
    } = body;

    const normalizedPermissions = Array.isArray(permissions)
      ? permissions
      : [];

    const companyRecord = await Company.findOne({
      _id: company,
      userId: session.user.id,
    });

    if (!companyRecord) {
      return NextResponse.json(
        { error: "Company not found or unauthorized" },
        { status: 404 }
      );
    }

    const teamMember = new TeamMember({
      name,
      email,
      role,
      department,
      phone,
      company,
      isActive,
      permissions: normalizedPermissions,
      userId: session.user.id,
    });
    await teamMember.save();

    const populatedMember = await TeamMember.findById(teamMember._id)
      .populate("company", "name industry");

    if (populatedMember) {
      await logAuditEvent({
        action: "team_member.created",
        actor: {
          id: session.user.id,
          name: session.user.name,
          email: session.user.email,
        },
        target: {
          type: "TeamMember",
          id: populatedMember._id.toString(),
          name: populatedMember.name,
        },
        description: `Created team member ${populatedMember.name}`,
        companyId: populatedMember.company?._id?.toString(),
        teamMemberId: populatedMember._id.toString(),
        metadata: {
          role: populatedMember.role,
          department: populatedMember.department,
          permissions: populatedMember.permissions,
        },
      });
    }

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
