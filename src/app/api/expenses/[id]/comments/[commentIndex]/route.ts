import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import Expense from "@/models/Expense";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; commentIndex: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { text } = await request.json();

    if (!text || typeof text !== "string" || text.trim().length === 0) {
      return NextResponse.json(
        { error: "Comment text is required" },
        { status: 400 }
      );
    }

    if (text.length > 500) {
      return NextResponse.json(
        { error: "Comment cannot exceed 500 characters" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const commentIndex = parseInt(params.commentIndex);
    if (isNaN(commentIndex) || commentIndex < 0) {
      return NextResponse.json(
        { error: "Invalid comment index" },
        { status: 400 }
      );
    }

    // Find the expense and verify ownership
    const expense = await Expense.findById(params.id).populate("company");
    if (!expense) {
      return NextResponse.json({ error: "Expense not found" }, { status: 404 });
    }

    if (expense.userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Check if comment index is valid
    if (commentIndex >= expense.comments.length) {
      return NextResponse.json(
        { error: "Comment not found" },
        { status: 404 }
      );
    }

    // Update the comment
    expense.comments[commentIndex].text = text.trim();
    expense.comments[commentIndex].createdAt = new Date(); // Update timestamp for edited comments
    
    await expense.save();

    return NextResponse.json(expense);
  } catch (error) {
    console.error("Error updating comment:", error);
    return NextResponse.json(
      { error: "Failed to update comment" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; commentIndex: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    const commentIndex = parseInt(params.commentIndex);
    if (isNaN(commentIndex) || commentIndex < 0) {
      return NextResponse.json(
        { error: "Invalid comment index" },
        { status: 400 }
      );
    }

    // Find the expense and verify ownership
    const expense = await Expense.findById(params.id).populate("company");
    if (!expense) {
      return NextResponse.json({ error: "Expense not found" }, { status: 404 });
    }

    if (expense.userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Check if comment index is valid
    if (commentIndex >= expense.comments.length) {
      return NextResponse.json(
        { error: "Comment not found" },
        { status: 404 }
      );
    }

    // Remove the comment
    expense.comments.splice(commentIndex, 1);
    
    await expense.save();

    return NextResponse.json(expense);
  } catch (error) {
    console.error("Error deleting comment:", error);
    return NextResponse.json(
      { error: "Failed to delete comment" },
      { status: 500 }
    );
  }
}