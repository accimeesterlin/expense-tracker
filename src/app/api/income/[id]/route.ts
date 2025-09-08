import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import Income from "@/models/Income";

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
    const income = await Income.findOne({
      _id: id,
      userId: session.user.id,
    })
      .populate("paymentMethod", "name type lastFourDigits")
      .populate("company", "name industry");

    if (!income) {
      return NextResponse.json({ error: "Income not found" }, { status: 404 });
    }

    return NextResponse.json(income);
  } catch (error) {
    console.error("Error fetching income:", error);
    return NextResponse.json(
      { error: "Failed to fetch income" },
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

    // Calculate next payment date for recurring income
    if (body.isRecurring && body.frequency && body.receivedDate) {
      const receivedDate = new Date(body.receivedDate);
      let nextPaymentDate = new Date(receivedDate);

      // Calculate next payment date based on frequency
      switch (body.frequency) {
        case "weekly":
          nextPaymentDate = new Date(
            nextPaymentDate.getTime() + 7 * 24 * 60 * 60 * 1000
          );
          break;
        case "bi-weekly":
          nextPaymentDate = new Date(
            nextPaymentDate.getTime() + 14 * 24 * 60 * 60 * 1000
          );
          break;
        case "monthly":
          nextPaymentDate = new Date(
            nextPaymentDate.getFullYear(),
            nextPaymentDate.getMonth() + 1,
            nextPaymentDate.getDate()
          );
          break;
        case "quarterly":
          nextPaymentDate = new Date(
            nextPaymentDate.getFullYear(),
            nextPaymentDate.getMonth() + 3,
            nextPaymentDate.getDate()
          );
          break;
        case "yearly":
          nextPaymentDate = new Date(
            nextPaymentDate.getFullYear() + 1,
            nextPaymentDate.getMonth(),
            nextPaymentDate.getDate()
          );
          break;
      }

      body.nextPaymentDate = nextPaymentDate;
    }

    const income = await Income.findOneAndUpdate(
      { _id: id, userId: session.user.id },
      body,
      {
        new: true,
        runValidators: true,
      }
    )
      .populate("paymentMethod", "name type lastFourDigits")
      .populate("company", "name industry");

    if (!income) {
      return NextResponse.json({ error: "Income not found" }, { status: 404 });
    }

    return NextResponse.json(income);
  } catch (error: unknown) {
    console.error("Error updating income:", error);

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
      { error: "Failed to update income" },
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
    const income = await Income.findOneAndUpdate(
      { _id: id, userId: session.user.id },
      { isActive: false },
      { new: true }
    );

    if (!income) {
      return NextResponse.json({ error: "Income not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Income deleted successfully" });
  } catch (error) {
    console.error("Error deleting income:", error);
    return NextResponse.json(
      { error: "Failed to delete income" },
      { status: 500 }
    );
  }
}
