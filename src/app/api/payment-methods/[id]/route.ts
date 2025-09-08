import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import PaymentMethod from "@/models/PaymentMethod";

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
    const paymentMethod = await PaymentMethod.findOne({
      _id: id,
      userId: session.user.id,
    });

    if (!paymentMethod) {
      return NextResponse.json(
        { error: "Payment method not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(paymentMethod);
  } catch (error) {
    console.error("Error fetching payment method:", error);
    return NextResponse.json(
      { error: "Failed to fetch payment method" },
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

    // If this is set as default, unset other defaults
    if (body.isDefault) {
      await PaymentMethod.updateMany(
        { userId: session.user.id, _id: { $ne: id } },
        { isDefault: false }
      );
    }

    const paymentMethod = await PaymentMethod.findOneAndUpdate(
      { _id: id, userId: session.user.id },
      body,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!paymentMethod) {
      return NextResponse.json(
        { error: "Payment method not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(paymentMethod);
  } catch (error: unknown) {
    console.error("Error updating payment method:", error);

    if (error && typeof error === "object" && "name" in error && error.name === "ValidationError") {
      const mongooseError = error as Error & { errors: Record<string, { message: string }> };
      const validationErrors = Object.values(mongooseError.errors).map(
        (err) => err.message
      );
      return NextResponse.json(
        { error: "Validation failed", details: validationErrors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update payment method" },
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
    const paymentMethod = await PaymentMethod.findOneAndUpdate(
      { _id: id, userId: session.user.id },
      { isActive: false },
      { new: true }
    );

    if (!paymentMethod) {
      return NextResponse.json(
        { error: "Payment method not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Payment method deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting payment method:", error);
    return NextResponse.json(
      { error: "Failed to delete payment method" },
      { status: 500 }
    );
  }
}
