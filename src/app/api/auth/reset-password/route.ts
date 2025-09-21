import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import PasswordReset from "@/models/PasswordReset";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const { token, password } = await request.json();

    if (!token || !password) {
      return NextResponse.json(
        { error: "Token and password are required" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters long" },
        { status: 400 }
      );
    }

    // Find valid password reset token
    const passwordReset = await PasswordReset.findOne({
      token,
      isUsed: false,
      expiresAt: { $gt: new Date() }
    });

    if (!passwordReset) {
      return NextResponse.json(
        { error: "Invalid or expired password reset token" },
        { status: 400 }
      );
    }

    // Find the user
    const user = await User.findById(passwordReset.userId);
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Hash the new password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Update user's password
    await User.findByIdAndUpdate(user._id, {
      password: hashedPassword,
    });

    // Mark the reset token as used
    await PasswordReset.findByIdAndUpdate(passwordReset._id, {
      isUsed: true,
    });

    return NextResponse.json({
      message: "Password has been reset successfully",
    });

  } catch (error) {
    console.error("Error in reset password:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET endpoint to validate reset token
export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { error: "Token is required" },
        { status: 400 }
      );
    }

    // Find valid password reset token
    const passwordReset = await PasswordReset.findOne({
      token,
      isUsed: false,
      expiresAt: { $gt: new Date() }
    });

    if (!passwordReset) {
      return NextResponse.json(
        { error: "Invalid or expired password reset token" },
        { status: 400 }
      );
    }

    // Find the user to get email
    const user = await User.findById(passwordReset.userId);
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      valid: true,
      email: user.email,
    });

  } catch (error) {
    console.error("Error validating reset token:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}