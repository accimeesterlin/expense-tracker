import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import PaymentMethod from "@/models/PaymentMethod";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const paymentMethods = await PaymentMethod.find({
      userId: session.user.id,
      isActive: true,
    }).sort({ isDefault: -1, createdAt: -1 });

    return NextResponse.json(paymentMethods);
  } catch (error) {
    console.error("Error fetching payment methods:", error);
    return NextResponse.json(
      { error: "Failed to fetch payment methods" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const body = await request.json();

    // If this is set as default, unset other defaults
    if (body.isDefault) {
      await PaymentMethod.updateMany(
        { userId: session.user.id },
        { isDefault: false }
      );
    }

    const paymentMethod = new PaymentMethod({
      ...body,
      userId: session.user.id,
    });

    await paymentMethod.save();

    return NextResponse.json(paymentMethod, { status: 201 });
  } catch (error: unknown) {
    console.error("Error creating payment method:", error);

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
      { error: "Failed to create payment method" },
      { status: 500 }
    );
  }
}
