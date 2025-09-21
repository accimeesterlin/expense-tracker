import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import TeamInvite from "@/models/TeamInvite";
import User from "@/models/User";
import Company from "@/models/Company";
import { ensureModelsRegistered } from "@/lib/models";

export async function GET(request: NextRequest) {
  try {
    // Ensure models are registered before proceeding
    ensureModelsRegistered();
    
    await dbConnect();
    
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        { error: "Token is required" },
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
        { error: "Invalid or expired invitation", isValid: false },
        { status: 400 }
      );
    }

    // Get inviter's name
    const inviter = await User.findById(invite.inviterId);
    const inviterName = inviter?.name || 'A team member';

    // Check if user already exists
    const existingUser = await User.findOne({ email: invite.email });
    const userExists = !!existingUser;

    return NextResponse.json({
      email: invite.email,
      role: invite.role,
      department: invite.department,
      companyName: invite.companyId.name,
      inviterName,
      permissions: invite.permissions || [],
      isValid: true,
      userExists, // This tells the frontend whether to show account creation
      userName: existingUser?.name, // Existing user's name if available
    });

  } catch (error) {
    console.error("Error fetching invite details:", error);
    return NextResponse.json(
      { error: "Failed to fetch invitation details", isValid: false },
      { status: 500 }
    );
  }
}