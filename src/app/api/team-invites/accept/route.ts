import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import TeamInvite from "@/models/TeamInvite";
import TeamMember from "@/models/TeamMember";
import User from "@/models/User";
import { sendWelcomeEmail } from "@/lib/email";
import { ensureModelsRegistered } from "@/lib/models";
import { logAuditEvent } from "@/lib/audit";

export async function POST(request: NextRequest) {
  try {
    // Ensure models are registered before proceeding
    ensureModelsRegistered();
    
    await dbConnect();
    const body = await request.json();
    const { token, userData } = body;

    if (!token) {
      return NextResponse.json(
        { error: "Invitation token is required" },
        { status: 400 }
      );
    }

    // Find the invitation
    const invite = await TeamInvite.findOne({
      token,
      isAccepted: false,
      expiresAt: { $gt: new Date() }
    }).populate('companyId', 'name');

    if (!invite) {
      return NextResponse.json(
        { error: "Invalid or expired invitation" },
        { status: 400 }
      );
    }

    // Check if user already exists
    let user = await User.findOne({ email: invite.email });
    
    if (!user && userData) {
      // Create new user account
      const { name, password } = userData;
      
      if (!name || !password) {
        return NextResponse.json(
          { error: "Name and password are required for new users" },
          { status: 400 }
        );
      }

      // Hash password
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash(password, 12);

      user = new User({
        name: name.trim(),
        email: invite.email,
        password: hashedPassword,
      });

      await user.save();

      // Send welcome email
      await sendWelcomeEmail(user.email, user.name);
    }

    if (!user) {
      return NextResponse.json(
        { error: "User account required. Please sign in to accept this invitation." },
        { status: 400 }
      );
    }

    // Create team member
    const teamMember = new TeamMember({
      name: user.name,
      email: user.email,
      role: invite.role,
      department: invite.department,
      phone: invite.phone,
      company: invite.companyId,
      userId: user._id.toString(), // The actual team member's user ID
      permissions: invite.permissions,
      isActive: true,
    });

    await teamMember.save();

    // Mark invitation as accepted
    invite.isAccepted = true;
    await invite.save();

    // Populate the team member for response
    await teamMember.populate('company', 'name industry');

    const companyDoc = invite.companyId as
      | string
      | ( {
          _id?: { toString: () => string };
          name?: string;
        });

    const companyIdValue =
      typeof companyDoc === 'string'
        ? companyDoc
        : companyDoc?._id?.toString() ?? teamMember.company?.toString();

    const companyName =
      typeof companyDoc === 'string' ? undefined : companyDoc?.name;

    await logAuditEvent({
      action: "team_invite.accepted",
      actor: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
      },
      target: {
        type: "TeamInvite",
        id: invite._id.toString(),
        name: invite.email,
      },
      description: `${user.name || invite.email} accepted team invitation${companyName ? ` for ${companyName}` : ""}`,
      companyId: companyIdValue,
      teamMemberId: teamMember._id.toString(),
      metadata: {
        inviteId: invite._id.toString(),
        role: invite.role,
      },
    });

    await logAuditEvent({
      action: "team_member.created",
      actor: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
      },
      target: {
        type: "TeamMember",
        id: teamMember._id.toString(),
        name: teamMember.name,
      },
      description: `${teamMember.name} joined ${companyName ?? "the company"} via invitation`,
      companyId: companyIdValue,
      teamMemberId: teamMember._id.toString(),
      metadata: {
        viaInvite: true,
        role: teamMember.role,
      },
    });

    return NextResponse.json({
      message: "Invitation accepted successfully",
      teamMember,
    }, { status: 200 });

  } catch (error: any) {
    console.error("Error accepting team invitation:", error);
    
    if (error.code === 11000) {
      return NextResponse.json(
        { error: "You are already a member of this team" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to accept invitation" },
      { status: 500 }
    );
  }
}
