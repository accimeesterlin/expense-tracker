import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import Income from "@/models/Income";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const frequency = searchParams.get("frequency");
    const isRecurring = searchParams.get("isRecurring");
    const year = searchParams.get("year");

    let query: any = { userId: session.user.id, isActive: true };

    if (category) query.category = category;
    if (frequency) query.frequency = frequency;
    if (isRecurring !== null) query.isRecurring = isRecurring === "true";
    if (year) {
      const startDate = new Date(parseInt(year), 0, 1);
      const endDate = new Date(parseInt(year), 11, 31);
      query.receivedDate = { $gte: startDate, $lte: endDate };
    }

    const income = await Income.find(query)
      .populate("paymentMethod", "name type lastFourDigits")
      .populate("company", "name industry")
      .sort({ receivedDate: -1 });

    return NextResponse.json(income);
  } catch (error) {
    console.error("Error fetching income:", error);
    return NextResponse.json(
      { error: "Failed to fetch income" },
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

    // Calculate next payment date for recurring income
    if (body.isRecurring && body.frequency && body.receivedDate) {
      const receivedDate = new Date(body.receivedDate);
      let nextPaymentDate = new Date(receivedDate);

      switch (body.frequency) {
        case "weekly":
          nextPaymentDate.setDate(nextPaymentDate.getDate() + 7);
          break;
        case "bi-weekly":
          nextPaymentDate.setDate(nextPaymentDate.getDate() + 14);
          break;
        case "monthly":
          nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1);
          break;
        case "quarterly":
          nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 3);
          break;
        case "yearly":
          nextPaymentDate.setFullYear(nextPaymentDate.getFullYear() + 1);
          break;
      }

      body.nextPaymentDate = nextPaymentDate;
    }

    const income = new Income({
      ...body,
      userId: session.user.id,
    });

    await income.save();

    const populatedIncome = await income
      .populate("paymentMethod", "name type lastFourDigits")
      .populate("company", "name industry");

    return NextResponse.json(populatedIncome, { status: 201 });
  } catch (error: any) {
    console.error("Error creating income:", error);

    if (error.name === "ValidationError") {
      const validationErrors = Object.values(error.errors).map(
        (err: any) => err.message
      );
      return NextResponse.json(
        { error: "Validation failed", details: validationErrors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create income" },
      { status: 500 }
    );
  }
}
