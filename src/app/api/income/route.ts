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

    const query: {
      userId: string;
      isActive: boolean;
      category?: string;
      frequency?: string;
      isRecurring?: boolean;
      receivedDate?: { $gte: Date; $lte: Date };
    } = { userId: session.user.id, isActive: true };

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

    console.log("Creating income with data:", { ...body, userId: session.user.id });
    
    const income = new Income({
      ...body,
      userId: session.user.id,
    });

    console.log("Saving income to database...");
    await income.save();
    console.log("Income saved successfully:", income._id);

    console.log("Populating income relationships...");
    const populatedIncome = await Income.findById(income._id)
      .populate("paymentMethod", "name type lastFourDigits")
      .populate("company", "name industry");
    console.log("Income populated successfully");

    console.log("Returning success response with status 201");
    return NextResponse.json(populatedIncome, { status: 201 });
  } catch (error: unknown) {
    console.error("Error creating income:", error);

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
      { error: "Failed to create income" },
      { status: 500 }
    );
  }
}
