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
    const { Company, Expense } = ensureModelsRegistered();

    const companies = await Company.find({ userId: session.user.id }).sort({
      createdAt: -1,
    });

    // Get expense statistics for each company
    const companiesWithStats = await Promise.all(
      companies.map(async (company) => {
        const expenses = await Expense.find({
          userId: session.user.id,
          company: company._id,
        });

        const totalAmount = expenses.reduce((sum, expense) => sum + expense.amount, 0);
        const expenseCount = expenses.length;

        return {
          ...company.toObject(),
          stats: {
            totalExpenses: expenseCount,
            totalAmount,
          },
        };
      })
    );

    return NextResponse.json(
      createSuccessResponse(
        API_VERSIONS.V1,
        companiesWithStats,
        "Companies retrieved successfully",
        { total: companiesWithStats.length }
      )
    );
  } catch (error) {
    console.error("Error fetching companies:", error);
    return NextResponse.json(
      createErrorResponse(API_VERSIONS.V1, "Failed to fetch companies"),
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
        createErrorResponse(API_VERSIONS.V1, "Company name is required"),
        { status: 400 }
      );
    }

    if (!body.industry?.trim()) {
      return NextResponse.json(
        createErrorResponse(API_VERSIONS.V1, "Industry is required"),
        { status: 400 }
      );
    }

    await dbConnect();
    const { Company } = ensureModelsRegistered();

    const company = new Company({
      userId: session.user.id,
      name: body.name.trim(),
      industry: body.industry.trim(),
      description: body.description?.trim(),
      address: {
        street: body.address?.street?.trim(),
        city: body.address?.city?.trim(),
        state: body.address?.state?.trim(),
        zipCode: body.address?.zipCode?.trim(),
      },
      contactInfo: {
        email: body.contactInfo?.email?.trim(),
        phone: body.contactInfo?.phone?.trim(),
        website: body.contactInfo?.website?.trim(),
      },
    });

    await company.save();

    return NextResponse.json(
      createSuccessResponse(API_VERSIONS.V1, company, "Company created successfully"),
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating company:", error);

    if (error.code === 11000) {
      return NextResponse.json(
        createErrorResponse(API_VERSIONS.V1, "Company with this name already exists"),
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
      createErrorResponse(API_VERSIONS.V1, "Failed to create company"),
      { status: 500 }
    );
  }
}