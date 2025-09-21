import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import TeamInvite from "@/models/TeamInvite";
import TeamMember from "@/models/TeamMember";
import Company from "@/models/Company";
import User from "@/models/User";
import { sendTeamInviteEmail } from "@/lib/email";
import { ensureModelsRegistered } from "@/lib/models";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  try {
    // Ensure models are registered before proceeding
    ensureModelsRegistered();
    
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const body = await request.json();
    const { email, companyId, role, department, phone, permissions } = body;

    // Validate required fields
    if (!email || !companyId || !role) {
      return NextResponse.json(
        { error: "Email, company, and role are required" },
        { status: 400 }
      );
    }

    // Verify the company belongs to the user
    const company = await Company.findOne({
      _id: companyId,
      userId: session.user.id,
    });

    if (!company) {
      return NextResponse.json(
        { error: "Company not found or unauthorized" },
        { status: 404 }
      );
    }

    // Check if user is already a team member of this company
    const existingTeamMember = await TeamMember.findOne({ 
      email: email.toLowerCase(), 
      company: companyId,
      isActive: true 
    });
    if (existingTeamMember) {
      return NextResponse.json(
        { error: "User is already a member of this company" },
        { status: 400 }
      );
    }

    // Check if there's already a pending invite
    const existingInvite = await TeamInvite.findOne({
      email: email.toLowerCase(),
      companyId,
      isAccepted: false,
      expiresAt: { $gt: new Date() }
    });

    // If there's an existing invite, delete it and create a new one
    if (existingInvite) {
      await TeamInvite.findByIdAndDelete(existingInvite._id);
      console.log('Deleted existing invitation and creating new one');
    }

    // Generate unique token
    const token = crypto.randomBytes(32).toString('hex');

    // Create invitation
    const invite = new TeamInvite({
      email: email.toLowerCase(),
      token,
      inviterId: session.user.id,
      companyId,
      role,
      department: department?.trim() || undefined,
      phone: phone?.trim() || undefined,
      permissions: permissions || ['view_expenses', 'create_expenses'],
    });

    await invite.save();

    // Get inviter's name
    const inviter = await User.findById(session.user.id);
    const inviterName = inviter?.name || session.user.name || 'A team member';

    // Send invitation email
    const emailResult = await sendTeamInviteEmail({
      to: email,
      inviterName,
      companyName: company.name,
      inviteToken: token,
      role,
    });

    if (!emailResult.success) {
      // If email fails, delete the invite
      await TeamInvite.findByIdAndDelete(invite._id);
      return NextResponse.json(
        { error: "Failed to send invitation email. Please configure an email service or try again later." },
        { status: 500 }
      );
    }

    // Check if email was just logged (no email service configured)
    const wasLogged = emailResult.data?.message?.includes('logged');
    
    return NextResponse.json({
      message: wasLogged 
        ? "Invitation created successfully (email service not configured - check console for invitation link)"
        : "Invitation sent successfully",
      inviteId: invite._id,
      inviteUrl: wasLogged ? emailResult.data?.inviteUrl : undefined,
    }, { status: 201 });

  } catch (error: any) {
    console.error("Error sending team invitation:", error);
    
    if (error.code === 11000) {
      return NextResponse.json(
        { error: "An invitation has already been sent to this email for this company" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to send invitation" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // Ensure models are registered before proceeding
    ensureModelsRegistered();
    
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    // Get all pending invitations sent by this user
    const invites = await TeamInvite.find({
      inviterId: session.user.id,
      isAccepted: false,
      expiresAt: { $gt: new Date() }
    })
    .populate('companyId', 'name')
    .sort({ createdAt: -1 });

    return NextResponse.json(invites);
  } catch (error) {
    console.error("Error fetching team invitations:", error);
    return NextResponse.json(
      { error: "Failed to fetch invitations" },
      { status: 500 }
    );
  }
}