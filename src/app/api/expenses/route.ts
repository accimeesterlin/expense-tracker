import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import Expense from "@/models/Expense";
import { ensureModelsRegistered } from "@/lib/models";

export async function GET(request: NextRequest) {
  try {
    // Ensure models are registered before proceeding
    ensureModelsRegistered();
    
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get("companyId");
    const category = searchParams.get("category");
    const expenseType = searchParams.get("expenseType");
    const isActive = searchParams.get("isActive");

    const query: { userId: string; company?: string; category?: string; expenseType?: string; isActive?: boolean } = { userId: session.user.id };

    if (companyId) query.company = companyId;
    if (category) query.category = category;
    if (expenseType) query.expenseType = expenseType;
    if (isActive !== null) query.isActive = isActive === "true";

    const expenses = await Expense.find(query)
      .populate("company", "name industry")
      .sort({ nextBillingDate: 1, createdAt: -1 });

    return NextResponse.json(expenses);
  } catch (error) {
    console.error("Error fetching expenses:", error);
    return NextResponse.json(
      { error: "Failed to fetch expenses" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Ensure models are registered before proceeding
    ensureModelsRegistered();
    
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const body = await request.json();

    // Calculate next billing date for subscriptions and recurring expenses
    if (
      (body.expenseType === "subscription" ||
        body.expenseType === "recurring") &&
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

    const expense = new Expense({
      ...body,
      userId: session.user.id,
    });
    await expense.save();

    const populatedExpense = await expense.populate("company", "name industry");

    return NextResponse.json(populatedExpense, { status: 201 });
  } catch (error: unknown) {
    console.error("Error creating expense:", error);

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
      { error: "Failed to create expense" },
      { status: 500 }
    );
  }
}
