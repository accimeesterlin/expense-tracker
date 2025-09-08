import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import Debt from "@/models/Debt";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const upcoming = searchParams.get("upcoming"); // Show only upcoming payments

    const query: { 
      userId: string; 
      isActive: boolean; 
      type?: string; 
      nextPaymentDate?: { $gte: Date; $lte: Date } 
    } = { userId: session.user.id, isActive: true };

    if (type) query.type = type;
    if (upcoming === "true") {
      const today = new Date();
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(today.getDate() + 30);
      query.nextPaymentDate = { $gte: today, $lte: thirtyDaysFromNow };
    }

    const debts = await Debt.find(query)
      .populate("paymentMethod", "name type lastFourDigits")
      .sort({ nextPaymentDate: 1 });

    return NextResponse.json(debts);
  } catch (error) {
    console.error("Error fetching debts:", error);
    return NextResponse.json(
      { error: "Failed to fetch debts" },
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

    const debt = new Debt({
      ...body,
      userId: session.user.id,
    });

    await debt.save();

    const populatedDebt = await debt.populate(
      "paymentMethod",
      "name type lastFourDigits"
    );

    return NextResponse.json(populatedDebt, { status: 201 });
  } catch (error: unknown) {
    console.error("Error creating debt:", error);

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
      { error: "Failed to create debt" },
      { status: 500 }
    );
  }
}
