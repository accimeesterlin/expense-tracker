import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import Expense from "@/models/Expense";

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
    const expense = await Expense.findOne({
      _id: id,
      userId: session.user.id,
    }).populate("company", "name industry");

    if (!expense) {
      return NextResponse.json({ error: "Expense not found" }, { status: 404 });
    }

    return NextResponse.json(expense);
  } catch (error) {
    console.error("Error fetching expense:", error);
    return NextResponse.json(
      { error: "Failed to fetch expense" },
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

    // Recalculate next billing date if frequency or start date changed
    if (
      body.expenseType === "subscription" &&
      body.frequency &&
      body.startDate
    ) {
      const startDate = new Date(body.startDate);
      let nextBillingDate = new Date(startDate);

      // Calculate next billing date based on frequency
      switch (body.frequency) {
        case "monthly":
          nextBillingDate = new Date(
            nextBillingDate.getFullYear(),
            nextBillingDate.getMonth() + 1,
            nextBillingDate.getDate()
          );
          break;
        case "quarterly":
          nextBillingDate = new Date(
            nextBillingDate.getFullYear(),
            nextBillingDate.getMonth() + 3,
            nextBillingDate.getDate()
          );
          break;
        case "yearly":
          nextBillingDate = new Date(
            nextBillingDate.getFullYear() + 1,
            nextBillingDate.getMonth(),
            nextBillingDate.getDate()
          );
          break;
        case "weekly":
          nextBillingDate = new Date(
            nextBillingDate.getTime() + 7 * 24 * 60 * 60 * 1000
          );
          break;
        case "daily":
          nextBillingDate = new Date(
            nextBillingDate.getTime() + 24 * 60 * 60 * 1000
          );
          break;
      }

      body.nextBillingDate = nextBillingDate;
    }

    const expense = await Expense.findOneAndUpdate(
      { _id: id, userId: session.user.id },
      body,
      {
        new: true,
        runValidators: true,
      }
    ).populate("company", "name industry");

    if (!expense) {
      return NextResponse.json({ error: "Expense not found" }, { status: 404 });
    }

    return NextResponse.json(expense);
  } catch (error: unknown) {
    console.error("Error updating expense:", error);

    if (
      error &&
      typeof error === "object" &&
      "name" in error &&
      error.name === "ValidationError"
    ) {
      const mongooseError = error as Error & { errors: Record<string, { message: string }> };
      const validationErrors = Object.values(mongooseError.errors || {}).map(
        (err) => err.message || "Validation error"
      );
      return NextResponse.json(
        { error: "Validation failed", details: validationErrors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update expense" },
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
    const expense = await Expense.findOneAndDelete({
      _id: id,
      userId: session.user.id,
    });

    if (!expense) {
      return NextResponse.json({ error: "Expense not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Expense deleted successfully" });
  } catch (error) {
    console.error("Error deleting expense:", error);
    return NextResponse.json(
      { error: "Failed to delete expense" },
      { status: 500 }
    );
  }
}
