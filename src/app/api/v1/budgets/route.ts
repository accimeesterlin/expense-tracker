import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import Budget from "@/models/Budget";
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
    
    const budgets = await Budget.find({ 
      userId: session.user.id,
      isActive: true
    }).sort({ startDate: -1 });
    
    // Calculate virtual properties manually since they're not included by default
    const budgetsWithCalculations = budgets.map(budget => {
      const budgetObj = budget.toObject();
      budgetObj.remainingAmount = Math.max(0, budget.totalAmount - budget.spentAmount);
      budgetObj.percentageUsed = budget.totalAmount > 0 ? (budget.spentAmount / budget.totalAmount) * 100 : 0;
      
      const now = new Date();
      const endDate = new Date(budget.endDate);
      const diffTime = endDate.getTime() - now.getTime();
      budgetObj.daysRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
      
      return budgetObj;
    });
    
    return NextResponse.json(
      createSuccessResponse(
        API_VERSIONS.V1,
        budgetsWithCalculations,
        "Budgets retrieved successfully",
        { total: budgetsWithCalculations.length }
      )
    );
  } catch (error) {
    console.error("Error fetching budgets:", error);
    return NextResponse.json(
      createErrorResponse(API_VERSIONS.V1, "Failed to fetch budgets"),
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
        createErrorResponse(API_VERSIONS.V1, "Budget name is required"),
        { status: 400 }
      );
    }

    if (!body.totalAmount || parseFloat(body.totalAmount) <= 0) {
      return NextResponse.json(
        createErrorResponse(API_VERSIONS.V1, "Valid total amount is required"),
        { status: 400 }
      );
    }

    if (!body.period) {
      return NextResponse.json(
        createErrorResponse(API_VERSIONS.V1, "Budget period is required"),
        { status: 400 }
      );
    }

    if (!body.startDate || !body.endDate) {
      return NextResponse.json(
        createErrorResponse(API_VERSIONS.V1, "Start date and end date are required"),
        { status: 400 }
      );
    }

    await dbConnect();

    const budget = new Budget({
      userId: session.user.id,
      name: body.name.trim(),
      description: body.description?.trim(),
      totalAmount: parseFloat(body.totalAmount),
      spentAmount: body.spentAmount || 0,
      currency: body.currency || "USD",
      category: body.category?.trim(),
      period: body.period,
      startDate: new Date(body.startDate),
      endDate: new Date(body.endDate),
      isActive: body.isActive !== undefined ? body.isActive : true,
      alertThreshold: body.alertThreshold || 80,
    });

    await budget.save();

    // Add virtual properties to response
    const budgetObj = budget.toObject();
    budgetObj.remainingAmount = Math.max(0, budget.totalAmount - budget.spentAmount);
    budgetObj.percentageUsed = budget.totalAmount > 0 ? (budget.spentAmount / budget.totalAmount) * 100 : 0;
    
    const now = new Date();
    const endDate = new Date(budget.endDate);
    const diffTime = endDate.getTime() - now.getTime();
    budgetObj.daysRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

    return NextResponse.json(
      createSuccessResponse(API_VERSIONS.V1, budgetObj, "Budget created successfully"),
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating budget:", error);
    
    if (error.code === 11000) {
      return NextResponse.json(
        createErrorResponse(API_VERSIONS.V1, "Budget with this name already exists"),
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
      createErrorResponse(API_VERSIONS.V1, "Failed to create budget"),
      { status: 500 }
    );
  }
}