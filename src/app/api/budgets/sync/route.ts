import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import Budget from "@/models/Budget";
import Expense from "@/models/Expense";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    // Get all active budgets for the user
    const budgets = await Budget.find({
      userId: session.user.email,
      isActive: true,
    });

    const updatedBudgets = [];

    for (const budget of budgets) {
      // Calculate actual spent amount from expenses for this budget
      // Include both directly assigned expenses and category-based expenses
      const matchConditions = {
        userId: session.user.email,
        $or: [
          // Expenses directly assigned to this budget
          { budget: budget._id },
          // Expenses that match by category and date range (for legacy budgets)
          // Only include if not directly assigned to any budget
          {
            $and: [
              {
                $or: [
                  {
                    paymentDate: {
                      $gte: budget.startDate,
                      $lte: budget.endDate,
                    },
                  },
                  {
                    paymentDate: { $exists: false },
                    createdAt: {
                      $gte: budget.startDate,
                      $lte: budget.endDate,
                    },
                  },
                ],
              },
              // If budget has a category, filter expenses by that category
              ...(budget.category ? [{ category: budget.category }] : []),
              // Exclude expenses that are already assigned to any budget (including this one)
              { budget: { $exists: false } },
            ],
          },
        ],
      };

      const spentAmount = await Expense.aggregate([
        { $match: matchConditions },
        {
          $group: {
            _id: null,
            totalSpent: { $sum: "$amount" },
          },
        },
      ]);

      const actualSpent =
        spentAmount.length > 0 ? spentAmount[0].totalSpent : 0;

      // Update the budget with the calculated spent amount
      const updatedBudget = await Budget.findByIdAndUpdate(
        budget._id,
        { spentAmount: actualSpent },
        { new: true }
      );

      if (updatedBudget) {
        updatedBudgets.push(updatedBudget);
      }
    }

    return NextResponse.json({
      message: `Successfully synced ${updatedBudgets.length} budgets`,
      updatedBudgets: updatedBudgets.length,
    });
  } catch (error) {
    console.error("Error syncing budgets:", error);
    return NextResponse.json(
      { error: "Failed to sync budgets" },
      { status: 500 }
    );
  }
}
