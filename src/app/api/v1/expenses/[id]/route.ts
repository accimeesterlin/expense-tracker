import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
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
    const { Expense } = ensureModelsRegistered();

    const expense = await Expense.findOne({
      _id: id,
      userId: session.user.id,
    }).populate("company", "name industry");

    if (!expense) {
      return NextResponse.json(
        createErrorResponse(API_VERSIONS.V1, "Expense not found"),
        { status: 404 }
      );
    }

    return NextResponse.json(
      createSuccessResponse(API_VERSIONS.V1, expense, "Expense retrieved successfully")
    );
  } catch (error) {
    console.error("Error fetching expense:", error);
    return NextResponse.json(
      createErrorResponse(API_VERSIONS.V1, "Failed to fetch expense"),
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
    const { Expense } = ensureModelsRegistered();

    // Find the expense first
    const expense = await Expense.findOne({
      _id: id,
      userId: session.user.id,
    });

    if (!expense) {
      return NextResponse.json(
        createErrorResponse(API_VERSIONS.V1, "Expense not found"),
        { status: 404 }
      );
    }

    // Update fields
    const updateFields: any = {};
    if (body.name !== undefined) updateFields.name = body.name.trim();
    if (body.description !== undefined) updateFields.description = body.description.trim();
    if (body.amount !== undefined) updateFields.amount = parseFloat(body.amount);
    if (body.company !== undefined) updateFields.company = body.company;
    if (body.category !== undefined) updateFields.category = body.category;
    if (body.tags !== undefined) updateFields.tags = body.tags;
    if (body.expenseType !== undefined) updateFields.expenseType = body.expenseType;
    if (body.frequency !== undefined) updateFields.frequency = body.frequency;
    if (body.startDate !== undefined) updateFields.startDate = body.startDate;
    if (body.paymentDate !== undefined) updateFields.paymentDate = body.paymentDate;
    if (body.isActive !== undefined) updateFields.isActive = body.isActive;
    if (body.receiptUrl !== undefined) updateFields.receiptUrl = body.receiptUrl;
    if (body.receiptS3Key !== undefined) updateFields.receiptS3Key = body.receiptS3Key;
    if (body.receiptFileName !== undefined) updateFields.receiptFileName = body.receiptFileName;
    if (body.receiptContentType !== undefined) updateFields.receiptContentType = body.receiptContentType;

    // Calculate next billing date if needed
    if ((updateFields.expenseType === "subscription" || updateFields.expenseType === "recurring") && 
        (body.startDate || body.frequency)) {
      const startDate = new Date(updateFields.startDate || expense.startDate);
      const frequency = updateFields.frequency || expense.frequency;
      const nextBillingDate = new Date(startDate);

      switch (frequency) {
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
      
      updateFields.nextBillingDate = nextBillingDate;
    }

    const updatedExpense = await Expense.findByIdAndUpdate(
      id,
      { $set: updateFields },
      { new: true, runValidators: true }
    ).populate("company", "name industry");

    return NextResponse.json(
      createSuccessResponse(API_VERSIONS.V1, updatedExpense, "Expense updated successfully")
    );
  } catch (error: any) {
    console.error("Error updating expense:", error);
    
    if (error.name === "ValidationError") {
      const validationErrors = Object.values(error.errors).map((err: any) => err.message);
      return NextResponse.json(
        createErrorResponse(API_VERSIONS.V1, `Validation failed: ${validationErrors.join(", ")}`),
        { status: 400 }
      );
    }

    return NextResponse.json(
      createErrorResponse(API_VERSIONS.V1, "Failed to update expense"),
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
    const { Expense } = ensureModelsRegistered();

    // Find the expense first to get receipt info
    const expense = await Expense.findOne({
      _id: id,
      userId: session.user.id,
    });

    if (!expense) {
      return NextResponse.json(
        createErrorResponse(API_VERSIONS.V1, "Expense not found"),
        { status: 404 }
      );
    }

    // Delete associated receipt from S3 if it exists
    if (expense.receiptS3Key) {
      try {
        const { S3Client, DeleteObjectCommand } = await import("@aws-sdk/client-s3");
        
        if (process.env.AWS_S3_REGION && process.env.AWS_S3_BUCKET_NAME) {
          const s3Client = new S3Client({
            region: process.env.AWS_S3_REGION,
          });

          const command = new DeleteObjectCommand({
            Bucket: process.env.AWS_S3_BUCKET_NAME,
            Key: expense.receiptS3Key,
          });

          await s3Client.send(command);
          console.log(`Successfully deleted receipt from S3: ${expense.receiptS3Key}`);
        }
      } catch (s3Error) {
        console.error("Error deleting receipt from S3:", s3Error);
        // Continue with expense deletion even if S3 deletion fails
      }
    }

    // Delete the expense
    await Expense.findByIdAndDelete(id);

    return NextResponse.json(
      createSuccessResponse(API_VERSIONS.V1, null, "Expense deleted successfully")
    );
  } catch (error) {
    console.error("Error deleting expense:", error);
    return NextResponse.json(
      createErrorResponse(API_VERSIONS.V1, "Failed to delete expense"),
      { status: 500 }
    );
  }
}