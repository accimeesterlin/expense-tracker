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
    const { Company, Expense } = ensureModelsRegistered();

    const company = await Company.findOne({ _id: id, userId: session.user.id });

    if (!company) {
      return NextResponse.json(
        createErrorResponse(API_VERSIONS.V1, "Company not found"),
        { status: 404 }
      );
    }

    // Get expense statistics for this company
    const expenses = await Expense.find({
      userId: session.user.id,
      company: company._id,
    });

    const totalAmount = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const expenseCount = expenses.length;

    const companyWithStats = {
      ...company.toObject(),
      stats: {
        totalExpenses: expenseCount,
        totalAmount,
      },
    };

    return NextResponse.json(
      createSuccessResponse(API_VERSIONS.V1, companyWithStats, "Company retrieved successfully")
    );
  } catch (error) {
    console.error("Error fetching company:", error);
    return NextResponse.json(
      createErrorResponse(API_VERSIONS.V1, "Failed to fetch company"),
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
    const { Company } = ensureModelsRegistered();

    // Find the company first
    const company = await Company.findOne({
      _id: id,
      userId: session.user.id,
    });

    if (!company) {
      return NextResponse.json(
        createErrorResponse(API_VERSIONS.V1, "Company not found"),
        { status: 404 }
      );
    }

    // Update fields
    const updateFields: any = {};
    if (body.name !== undefined) updateFields.name = body.name.trim();
    if (body.industry !== undefined) updateFields.industry = body.industry.trim();
    if (body.description !== undefined) updateFields.description = body.description?.trim();
    
    if (body.address) {
      updateFields.address = {};
      if (body.address.street !== undefined) updateFields.address.street = body.address.street?.trim();
      if (body.address.city !== undefined) updateFields.address.city = body.address.city?.trim();
      if (body.address.state !== undefined) updateFields.address.state = body.address.state?.trim();
      if (body.address.zipCode !== undefined) updateFields.address.zipCode = body.address.zipCode?.trim();
    }

    if (body.contactInfo) {
      updateFields.contactInfo = {};
      if (body.contactInfo.email !== undefined) updateFields.contactInfo.email = body.contactInfo.email?.trim();
      if (body.contactInfo.phone !== undefined) updateFields.contactInfo.phone = body.contactInfo.phone?.trim();
      if (body.contactInfo.website !== undefined) updateFields.contactInfo.website = body.contactInfo.website?.trim();
    }

    const updatedCompany = await Company.findByIdAndUpdate(
      id,
      { $set: updateFields },
      { new: true, runValidators: true }
    );

    return NextResponse.json(
      createSuccessResponse(API_VERSIONS.V1, updatedCompany, "Company updated successfully")
    );
  } catch (error: any) {
    console.error("Error updating company:", error);
    
    if (error.name === "ValidationError") {
      const validationErrors = Object.values(error.errors).map((err: any) => err.message);
      return NextResponse.json(
        createErrorResponse(API_VERSIONS.V1, `Validation failed: ${validationErrors.join(", ")}`),
        { status: 400 }
      );
    }

    return NextResponse.json(
      createErrorResponse(API_VERSIONS.V1, "Failed to update company"),
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
    const { Company, Expense } = ensureModelsRegistered();

    // Find the company first
    const company = await Company.findOne({
      _id: id,
      userId: session.user.id,
    });

    if (!company) {
      return NextResponse.json(
        createErrorResponse(API_VERSIONS.V1, "Company not found"),
        { status: 404 }
      );
    }

    // Check if there are associated expenses
    const associatedExpenses = await Expense.countDocuments({
      userId: session.user.id,
      company: id,
    });

    if (associatedExpenses > 0) {
      return NextResponse.json(
        createErrorResponse(API_VERSIONS.V1, "Cannot delete company with associated expenses"),
        { status: 409 }
      );
    }

    // Delete the company
    await Company.findByIdAndDelete(id);

    return NextResponse.json(
      createSuccessResponse(API_VERSIONS.V1, null, "Company deleted successfully")
    );
  } catch (error) {
    console.error("Error deleting company:", error);
    return NextResponse.json(
      createErrorResponse(API_VERSIONS.V1, "Failed to delete company"),
      { status: 500 }
    );
  }
}