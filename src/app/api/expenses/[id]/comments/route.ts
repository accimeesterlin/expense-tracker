import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import Expense from "@/models/Expense";

export async function POST(
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
    const { text } = await request.json();

    if (!text?.trim()) {
      return NextResponse.json(
        { error: "Comment text is required" },
        { status: 400 }
      );
    }

    const expense = await Expense.findOneAndUpdate(
      { _id: id, userId: session.user.id },
      {
        $push: {
          comments: {
            text: text.trim(),
            createdAt: new Date(),
          },
        },
      },
      {
        new: true,
        runValidators: true,
      }
    ).populate("company", "name industry address contactInfo");

    if (!expense) {
      return NextResponse.json({ error: "Expense not found" }, { status: 404 });
    }

    return NextResponse.json(expense);
  } catch (error) {
    console.error("Error adding comment:", error);
    return NextResponse.json(
      { error: "Failed to add comment" },
      { status: 500 }
    );
  }
}