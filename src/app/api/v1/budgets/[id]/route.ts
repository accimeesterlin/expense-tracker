import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import Budget from "@/models/Budget";
import { ensureModelsRegistered } from "@/lib/models";
import { createSuccessResponse, createErrorResponse, API_VERSIONS } from "@/lib/apiVersion";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
    const { id } = await params;

    const budget = await Budget.findOne({
      _id: id,
      userId: session.user.id,
    });

    if (!budget) {
      return NextResponse.json(
        createErrorResponse(API_VERSIONS.V1, "Budget not found"),
        { status: 404 }
      );
    }

    // Add virtual properties to response
    const budgetObj = budget.toObject();
    budgetObj.remainingAmount = Math.max(0, budget.totalAmount - budget.spentAmount);
    budgetObj.percentageUsed = budget.totalAmount > 0 ? (budget.spentAmount / budget.totalAmount) * 100 : 0;
    
    const now = new Date();
    const endDate = new Date(budget.endDate);
    const diffTime = endDate.getTime() - now.getTime();
    budgetObj.daysRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

    return NextResponse.json(
      createSuccessResponse(API_VERSIONS.V1, budgetObj, "Budget retrieved successfully")
    );
  } catch (error) {
    console.error("Error fetching budget:", error);
    return NextResponse.json(
      createErrorResponse(API_VERSIONS.V1, "Failed to fetch budget"),
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
    const { id } = await params;
    const body = await request.json();

    // Find the budget first
    const existingBudget = await Budget.findOne({
      _id: id,
      userId: session.user.id,
    });

    if (!existingBudget) {
      return NextResponse.json(
        createErrorResponse(API_VERSIONS.V1, "Budget not found"),
        { status: 404 }
      );
    }

    // Update fields
    const updateFields: any = {};
    if (body.name !== undefined) updateFields.name = body.name.trim();
    if (body.description !== undefined) updateFields.description = body.description?.trim();
    if (body.totalAmount !== undefined) updateFields.totalAmount = parseFloat(body.totalAmount);
    if (body.spentAmount !== undefined) updateFields.spentAmount = parseFloat(body.spentAmount);
    if (body.currency !== undefined) updateFields.currency = body.currency;
    if (body.category !== undefined) updateFields.category = body.category?.trim();
    if (body.period !== undefined) updateFields.period = body.period;
    if (body.startDate !== undefined) updateFields.startDate = new Date(body.startDate);
    if (body.endDate !== undefined) updateFields.endDate = new Date(body.endDate);
    if (body.isActive !== undefined) updateFields.isActive = body.isActive;
    if (body.alertThreshold !== undefined) updateFields.alertThreshold = body.alertThreshold;

    const budget = await Budget.findByIdAndUpdate(
      id,
      { $set: updateFields },
      { new: true, runValidators: true }
    );

    // Add virtual properties to response
    const budgetObj = budget!.toObject();
    budgetObj.remainingAmount = Math.max(0, budget!.totalAmount - budget!.spentAmount);
    budgetObj.percentageUsed = budget!.totalAmount > 0 ? (budget!.spentAmount / budget!.totalAmount) * 100 : 0;
    
    const now = new Date();
    const endDate = new Date(budget!.endDate);
    const diffTime = endDate.getTime() - now.getTime();
    budgetObj.daysRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

    return NextResponse.json(
      createSuccessResponse(API_VERSIONS.V1, budgetObj, "Budget updated successfully")
    );
  } catch (error: any) {
    console.error("Error updating budget:", error);
    
    if (error.name === "ValidationError") {
      const validationErrors = Object.values(error.errors).map((err: any) => err.message);
      return NextResponse.json(
        createErrorResponse(API_VERSIONS.V1, `Validation failed: ${validationErrors.join(", ")}`),
        { status: 400 }
      );
    }

    return NextResponse.json(
      createErrorResponse(API_VERSIONS.V1, "Failed to update budget"),
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
    const { id } = await params;

    const budget = await Budget.findOneAndDelete({
      _id: id,
      userId: session.user.id,
    });

    if (!budget) {
      return NextResponse.json(
        createErrorResponse(API_VERSIONS.V1, "Budget not found"),
        { status: 404 }
      );
    }

    return NextResponse.json(
      createSuccessResponse(API_VERSIONS.V1, null, "Budget deleted successfully")
    );
  } catch (error) {
    console.error("Error deleting budget:", error);
    return NextResponse.json(
      createErrorResponse(API_VERSIONS.V1, "Failed to delete budget"),
      { status: 500 }
    );
  }
}