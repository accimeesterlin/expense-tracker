import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import Debt from "@/models/Debt";

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
    const debt = await Debt.findOne({
      _id: id,
      userId: session.user.id,
    }).populate("paymentMethod", "name type lastFourDigits");

    if (!debt) {
      return NextResponse.json({ error: "Debt not found" }, { status: 404 });
    }

    return NextResponse.json(debt);
  } catch (error) {
    console.error("Error fetching debt:", error);
    return NextResponse.json(
      { error: "Failed to fetch debt" },
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

    const debt = await Debt.findOneAndUpdate(
      { _id: id, userId: session.user.id },
      body,
      {
        new: true,
        runValidators: true,
      }
    ).populate("paymentMethod", "name type lastFourDigits");

    if (!debt) {
      return NextResponse.json({ error: "Debt not found" }, { status: 404 });
    }

    return NextResponse.json(debt);
  } catch (error: unknown) {
    console.error("Error updating debt:", error);

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
      { error: "Failed to update debt" },
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
    const debt = await Debt.findOneAndUpdate(
      { _id: id, userId: session.user.id },
      { isActive: false },
      { new: true }
    );

    if (!debt) {
      return NextResponse.json({ error: "Debt not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Debt deleted successfully" });
  } catch (error) {
    console.error("Error deleting debt:", error);
    return NextResponse.json(
      { error: "Failed to delete debt" },
      { status: 500 }
    );
  }
}
