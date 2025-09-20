import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import Company from "@/models/Company";
import Expense from "@/models/Expense";
import { ensureModelsRegistered } from "@/lib/models";

export async function GET() {
  try {
    // Ensure models are registered before proceeding
    ensureModelsRegistered();
    
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const companies = await Company.find({ userId: session.user.id }).sort({
      createdAt: -1,
    });

    // Get expense stats for each company
    const companiesWithStats = await Promise.all(
      companies.map(async (company) => {
        // Try both user ID and email for compatibility
        const expenses = await Expense.find({ 
          $or: [
            { userId: session.user.id, company: company._id, isActive: true },
            { userId: session.user.email, company: company._id, isActive: true }
          ]
        });
        
        const expenseCount = expenses.length;
        const totalAmount = expenses.reduce((sum, expense) => sum + expense.amount, 0);
        
        return {
          ...company.toObject(),
          expenseCount,
          totalAmount
        };
      })
    );

    return NextResponse.json(companiesWithStats);
  } catch (error) {
    console.error("Error fetching companies:", error);
    return NextResponse.json(
      { error: "Failed to fetch companies" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Ensure models are registered before proceeding
    ensureModelsRegistered();
    
    const session = await getServerSession(authOptions);
    console.log("Session in POST /api/companies:", session);
    if (!session?.user?.id) {
      console.log("No session or user ID found");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const body = await request.json();

    const company = new Company({
      ...body,
      userId: session.user.id,
    });
    await company.save();

    return NextResponse.json(company, { status: 201 });
  } catch (error: unknown) {
    console.error("Error creating company:", error);

    if (error && typeof error === "object" && "name" in error && error.name === "ValidationError") {
      const mongooseError = error as Error & { errors: Record<string, { message: string }> };
      const validationErrors = Object.values(mongooseError.errors).map(
        (err) => err.message
      );
      return NextResponse.json(
        { error: "Validation failed", details: validationErrors },
        { status: 400 }
      );
    }

    if (error && typeof error === "object" && "code" in error && error.code === 11000) {
      return NextResponse.json(
        { error: "Company with this tax ID already exists" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create company" },
      { status: 500 }
    );
  }
}
