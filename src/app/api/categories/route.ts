import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import Expense from "@/models/Expense";
import Income from "@/models/Income";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    // Get unique categories from expenses and income
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
