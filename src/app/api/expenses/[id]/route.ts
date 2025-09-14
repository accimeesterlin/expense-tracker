import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import Expense from "@/models/Expense";
import { ensureModelsRegistered } from "@/lib/models";

// Function to delete receipt from S3
async function deleteReceiptFromS3(s3Key: string): Promise<boolean> {
  try {
    // Dynamic import to avoid issues in environments without AWS SDK
    const { S3Client, DeleteObjectCommand } = await import("@aws-sdk/client-s3");
    
    if (!process.env.AWS_S3_REGION || !process.env.AWS_S3_BUCKET_NAME) {
      console.warn("AWS S3 not configured, skipping receipt deletion from S3");
      return false;
    }

    const s3Client = new S3Client({
      region: process.env.AWS_S3_REGION,
    });

    const command = new DeleteObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: s3Key,
    });

    await s3Client.send(command);
    console.log(`Successfully deleted receipt from S3: ${s3Key}`);
    return true;
  } catch (error) {
    console.error(`Failed to delete receipt from S3 (${s3Key}):`, error);
    return false;
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Ensure models are registered before proceeding
    ensureModelsRegistered();
    
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const { id } = await params;
    const expense = await Expense.findOne({
      _id: id,
      userId: session.user.id,
    }).populate("company", "name industry");

    if (!expense) {
      return NextResponse.json({ error: "Expense not found" }, { status: 404 });
    }

    return NextResponse.json(expense);
  } catch (error) {
    console.error("Error fetching expense:", error);
    return NextResponse.json(
      { error: "Failed to fetch expense" },
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
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const { id } = await params;
    const body = await request.json();

    // Handle nextBillingDate for subscription and recurring expenses
    if (
      (body.expenseType === "subscription" || body.expenseType === "recurring") &&
      body.frequency &&
      body.startDate &&
      !body.nextBillingDate
    ) {
      const startDate = new Date(body.startDate);
      const nextBillingDate = new Date(startDate);

      // Calculate next billing date based on frequency
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

    // Remove undefined fields to prevent validation errors
    const cleanedBody = Object.fromEntries(
      Object.entries(body).filter(([, value]) => value !== undefined)
    );

    const expense = await Expense.findOneAndUpdate(
      { _id: id, userId: session.user.id },
      cleanedBody,
      {
        new: true,
        runValidators: true,
      }
    ).populate("company", "name industry");

    if (!expense) {
      return NextResponse.json({ error: "Expense not found" }, { status: 404 });
    }

    return NextResponse.json(expense);
  } catch (error: unknown) {
    console.error("Error updating expense:", error);

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
      { error: "Failed to update expense" },
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
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const { id } = await params;
    
    // First, find the expense to get receipt information before deletion
    const expense = await Expense.findOne({
      _id: id,
      userId: session.user.id,
    });

    if (!expense) {
      return NextResponse.json({ error: "Expense not found" }, { status: 404 });
    }

    // Delete associated receipt from S3 if it exists
    let s3DeletionResults = [];
    if (expense.receiptS3Key) {
      console.log(`Attempting to delete receipt from S3: ${expense.receiptS3Key}`);
      const s3DeleteSuccess = await deleteReceiptFromS3(expense.receiptS3Key);
      s3DeletionResults.push({
        key: expense.receiptS3Key,
        success: s3DeleteSuccess,
        type: 'receipt'
      });
    }

    // Now delete the expense from the database
    await Expense.findOneAndDelete({
      _id: id,
      userId: session.user.id,
    });

    console.log(`Expense deleted successfully: ${id}`);

    return NextResponse.json({ 
      message: "Expense deleted successfully",
      s3Deletions: s3DeletionResults
    });
  } catch (error) {
    console.error("Error deleting expense:", error);
    return NextResponse.json(
      { error: "Failed to delete expense" },
      { status: 500 }
    );
  }
}
