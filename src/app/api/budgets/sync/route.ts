import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import Budget from "@/models/Budget";
import Expense from "@/models/Expense";
import mongoose from "mongoose";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Use both email and id to handle different user identifier patterns
    const userEmail = session.user.email;
    const userId = session.user.id;

    await connectToDatabase();

    // Get all active budgets for the user (budgets use email as userId)
    const budgets = await Budget.find({
      userId: userEmail,
      isActive: true,
    });

    const updatedBudgets = [];

    for (const budget of budgets) {
      // Calculate actual spent amount from expenses for this budget
      // Include both directly assigned expenses and category-based expenses
      const categoryConditions = budget.category 
        ? [{ category: budget.category }] 
        : [];
      
      const matchConditions = {
        userId: userId, // expenses use id as userId
        $or: [
          // Expenses directly assigned to this budget
          { budget: new mongoose.Types.ObjectId(budget._id.toString()) },
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
              // Only include unassigned expenses for category-based matching
              { 
                $or: [
                  { budget: { $exists: false } },
                  { budget: null }
                ]
              },
              // If budget has a category, filter expenses by that category
              ...categoryConditions,
            ],
          },
        ],
      };

      // Debug: Get the actual expenses that match
      const matchingExpenses = await Expense.find(matchConditions).select('name amount budget category paymentDate createdAt');
      
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
      
      console.log(`Budget ${budget.name}:`, {
        matchingExpenses: matchingExpenses.length,
        actualSpent,
        expenseDetails: matchingExpenses.map(e => ({
          name: e.name,
          amount: e.amount,
          budget: e.budget,
          category: e.category,
          paymentDate: e.paymentDate,
          createdAt: e.createdAt
        }))
      });

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
      debug: {
        totalBudgets: budgets.length,
        processedBudgets: updatedBudgets.map(budget => ({
          id: budget._id,
          name: budget.name,
          spentAmount: budget.spentAmount,
          totalAmount: budget.totalAmount,
          category: budget.category,
        }))
      }
    });
  } catch (error) {
    console.error("Error syncing budgets:", error);
    return NextResponse.json(
      { error: "Failed to sync budgets" },
      { status: 500 }
    );
  }
}
