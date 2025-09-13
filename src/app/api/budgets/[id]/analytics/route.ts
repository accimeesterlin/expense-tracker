import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import Budget from "@/models/Budget";
import Expense from "@/models/Expense";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();
    const { id } = await params;

    // Get the budget
    const budget = await Budget.findOne({
      _id: id,
      userId: session.user.email,
    });

    if (!budget) {
      return NextResponse.json({ error: "Budget not found" }, { status: 404 });
    }

    // Calculate actual spent amount from expenses
    const spentAmount = await Expense.aggregate([
      {
        $match: {
          userId: session.user.email,
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
          // If budget has a category, filter expenses by that category
          ...(budget.category ? { category: budget.category } : {}),
        },
      },
      {
        $group: {
          _id: null,
          totalSpent: { $sum: "$amount" },
          expenseCount: { $sum: 1 },
        },
      },
    ]);

    const actualSpent = spentAmount.length > 0 ? spentAmount[0].totalSpent : 0;
    const expenseCount =
      spentAmount.length > 0 ? spentAmount[0].expenseCount : 0;

    // Get expenses breakdown by category if budget doesn't have a specific category
    let categoryBreakdown = [];
    if (!budget.category) {
      categoryBreakdown = await Expense.aggregate([
        {
          $match: {
            userId: session.user.email,
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
        },
        {
          $group: {
            _id: "$category",
            total: { $sum: "$amount" },
            count: { $sum: 1 },
          },
        },
        { $sort: { total: -1 } },
      ]);
    }

    // Get recent expenses for this budget period
    const recentExpenses = await Expense.find({
      userId: session.user.email,
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
      ...(budget.category ? { category: budget.category } : {}),
    })
      .populate("company", "name")
      .sort({ paymentDate: -1, createdAt: -1 })
      .limit(10)
      .select("name amount category paymentDate createdAt company");

    // Calculate budget health metrics
    const percentageUsed =
      budget.totalAmount > 0 ? (actualSpent / budget.totalAmount) * 100 : 0;
    const remainingAmount = Math.max(0, budget.totalAmount - actualSpent);
    const isOverBudget = actualSpent > budget.totalAmount;
    const isNearLimit = percentageUsed >= budget.alertThreshold;

    // Calculate daily spending rate
    const now = new Date();
    const startDate = new Date(budget.startDate);
    const endDate = new Date(budget.endDate);
    const totalDays = Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    const daysPassed = Math.ceil(
      (now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    const dailySpendingRate = daysPassed > 0 ? actualSpent / daysPassed : 0;
    const projectedTotal = dailySpendingRate * totalDays;

    return NextResponse.json({
      budget: {
        ...budget.toObject(),
        actualSpent,
        remainingAmount,
        percentageUsed,
        isOverBudget,
        isNearLimit,
        expenseCount,
      },
      analytics: {
        categoryBreakdown,
        recentExpenses,
        dailySpendingRate,
        projectedTotal,
        daysPassed,
        totalDays,
        daysRemaining: Math.max(0, totalDays - daysPassed),
      },
    });
  } catch (error) {
    console.error("Error fetching budget analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch budget analytics" },
      { status: 500 }
    );
  }
}
