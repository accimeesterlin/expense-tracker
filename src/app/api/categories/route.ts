import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import Category from "@/models/Category";
import Expense from "@/models/Expense";
import Income from "@/models/Income";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    // Get user's custom categories
    const userCategories = await Category.find({ 
      userId: session.user.id 
    }).sort({ createdAt: -1 });

    // If no custom categories, return them for the categories management page
    if (userCategories.length > 0) {
      return NextResponse.json(userCategories);
    }

    // Get unique categories from expenses and income for suggestions
    const [expenseCategories, incomeCategories] = await Promise.all([
      Expense.distinct("category", { userId: session.user.id, isActive: true }),
      Income.distinct("category", { userId: session.user.id, isActive: true }),
    ]);

    // Combine and deduplicate categories
    const allCategories = [
      ...new Set([...expenseCategories, ...incomeCategories]),
    ];

    // Common categories to suggest
    const commonCategories = [
      "Food & Dining",
      "Transportation",
      "Entertainment",
      "Shopping",
      "Bills & Utilities",
      "Healthcare",
      "Travel",
      "Education",
      "Salary",
      "Freelance",
      "Investment",
      "Business",
      "Other",
    ];

    // Combine user categories with common categories, removing duplicates
    const suggestedCategories = [
      ...new Set([...allCategories, ...commonCategories]),
    ];

    return NextResponse.json({
      categories: suggestedCategories,
      userCategories: allCategories,
    });
  } catch (error) {
    console.error("Error fetching categories:", error);
    return NextResponse.json(
      { error: "Failed to fetch categories" },
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

    const category = await Category.create({
      ...body,
      userId: session.user.id,
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error: unknown) {
    console.error("Error creating category:", error);

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
        { error: "Category with this name already exists" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create category" },
      { status: 500 }
    );
  }
}
