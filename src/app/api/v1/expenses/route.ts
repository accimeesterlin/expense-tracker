import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import { ensureModelsRegistered } from "@/lib/models";
import { createSuccessResponse, createErrorResponse, API_VERSIONS } from "@/lib/apiVersion";

export async function GET() {
  try {
    // Ensure models are registered before proceeding
    ensureModelsRegistered();
    
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        createErrorResponse(API_VERSIONS.V1, "Unauthorized"),
        { status: 401 }
      );
    }

    await dbConnect();
    const { Expense } = ensureModelsRegistered();

    const expenses = await Expense.find({ userId: session.user.id })
      .populate("company", "name industry")
      .sort({ createdAt: -1 });

    return NextResponse.json(
      createSuccessResponse(
        API_VERSIONS.V1,
        expenses,
        "Expenses retrieved successfully",
        { total: expenses.length }
      )
    );
  } catch (error) {
    console.error("Error fetching expenses:", error);
    return NextResponse.json(
      createErrorResponse(API_VERSIONS.V1, "Failed to fetch expenses"),
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
      return NextResponse.json(
        createErrorResponse(API_VERSIONS.V1, "Unauthorized"),
        { status: 401 }
      );
    }

    const body = await request.json();
    
    // Validation
    if (!body.name?.trim()) {
      return NextResponse.json(
        createErrorResponse(API_VERSIONS.V1, "Expense name is required"),
        { status: 400 }
      );
    }

    if (!body.amount || parseFloat(body.amount) <= 0) {
      return NextResponse.json(
        createErrorResponse(API_VERSIONS.V1, "Valid amount is required"),
        { status: 400 }
      );
    }

    if (!body.company) {
      return NextResponse.json(
        createErrorResponse(API_VERSIONS.V1, "Company is required"),
        { status: 400 }
      );
    }

    await dbConnect();
    const { Expense } = ensureModelsRegistered();

    // Calculate next billing date for subscriptions/recurring expenses
    let nextBillingDate;
    if ((body.expenseType === "subscription" || body.expenseType === "recurring") && body.startDate && body.frequency) {
      const startDate = new Date(body.startDate);
      nextBillingDate = new Date(startDate);

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
      }
    }

    const expense = new Expense({
      userId: session.user.id,
      company: body.company,
      name: body.name.trim(),
      description: body.description?.trim() || body.name.trim(),
      amount: parseFloat(body.amount),
      currency: body.currency || "USD",
      category: body.category,
      tags: body.tags || [],
      expenseType: body.expenseType,
      frequency: (body.expenseType === "subscription" || body.expenseType === "recurring") ? body.frequency : undefined,
      startDate: body.startDate || new Date().toISOString().split("T")[0],
      paymentDate: body.paymentDate,
      nextBillingDate,
      isActive: body.isActive !== undefined ? body.isActive : true,
      receiptUrl: body.receiptUrl,
      receiptS3Key: body.receiptS3Key,
      receiptFileName: body.receiptFileName,
      receiptContentType: body.receiptContentType,
    });

    await expense.save();
    await expense.populate("company", "name industry");

    return NextResponse.json(
      createSuccessResponse(
        API_VERSIONS.V1,
        expense,
        "Expense created successfully"
      ),
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating expense:", error);
    
    if (error.code === 11000) {
      return NextResponse.json(
        createErrorResponse(API_VERSIONS.V1, "Expense with this name already exists"),
        { status: 409 }
      );
    }

    if (error.name === "ValidationError") {
      const validationErrors = Object.values(error.errors).map((err: any) => err.message);
      return NextResponse.json(
        createErrorResponse(API_VERSIONS.V1, `Validation failed: ${validationErrors.join(", ")}`),
        { status: 400 }
      );
    }

    return NextResponse.json(
      createErrorResponse(API_VERSIONS.V1, "Failed to create expense"),
      { status: 500 }
    );
  }
}