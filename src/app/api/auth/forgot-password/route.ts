import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import PasswordReset from "@/models/PasswordReset";
import { sendPasswordResetEmail } from "@/lib/email";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      // Return success even if user doesn't exist for security reasons
      return NextResponse.json({
        message: "If an account with that email exists, a password reset link has been sent.",
      });
    }

    // Delete any existing password reset tokens for this user
    await PasswordReset.deleteMany({ 
      userId: user._id.toString(),
      isUsed: false 
    });

    // Generate secure token
    const resetToken = crypto.randomBytes(32).toString('hex');

    // Create password reset record
    const passwordReset = new PasswordReset({
      email: email.toLowerCase(),
      token: resetToken,
      userId: user._id.toString(),
    });

    await passwordReset.save();

    // Send password reset email
    const emailResult = await sendPasswordResetEmail({
      to: email.toLowerCase(),
      resetToken,
      userName: user.name,
    });

    if (!emailResult.success) {
      // If email fails, delete the reset token
      await PasswordReset.findByIdAndDelete(passwordReset._id);
      return NextResponse.json(
        { error: "Failed to send password reset email. Please try again later." },
        { status: 500 }
      );
    }

    // Check if email was just logged (no email service configured)
    const wasLogged = emailResult.data?.message?.includes('logged');
    
    return NextResponse.json({
      message: wasLogged 
        ? "Password reset request created (email service not configured - check console for reset link)"
        : "If an account with that email exists, a password reset link has been sent.",
      resetUrl: wasLogged ? emailResult.data?.resetUrl : undefined,
    });

  } catch (error) {
    console.error("Error in forgot password:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}