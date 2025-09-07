import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import Expense from "@/models/Expense";

export async function GET(request: NextRequest) {
  try {
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

    let query: any = { userId: session.user.id };

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
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const body = await request.json();

    // Calculate next billing date for subscriptions and recurring expenses
    if (
      (body.expenseType === "subscription" || body.expenseType === "recurring") &&
      body.frequency &&
      body.startDate
    ) {
      const startDate = new Date(body.startDate);
      let nextBillingDate = new Date(startDate);

      switch (body.frequency) {
        case "monthly":
          nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
          break;
        case "quarterly":
          nextBillingDate.setMonth(nextBillingDate.getMonth() + 3);
          break;
        case "yearly":
          nextBillingDate.setFullYear(nextBillingDate.getFullYear() + 1);
          break;
        case "weekly":
          nextBillingDate.setDate(nextBillingDate.getDate() + 7);
          break;
        case "daily":
          nextBillingDate.setDate(nextBillingDate.getDate() + 1);
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
  } catch (error: any) {
    console.error("Error creating expense:", error);

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
      { error: "Failed to create expense" },
      { status: 500 }
    );
  }
}
