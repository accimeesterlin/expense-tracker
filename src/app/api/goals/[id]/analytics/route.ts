import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import Goal from "@/models/Goal";
import Income from "@/models/Income";
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

    // Get the goal
    const goal = await Goal.findOne({
      _id: id,
      userId: session.user.email,
    });

    if (!goal) {
      return NextResponse.json({ error: "Goal not found" }, { status: 404 });
    }

    // Calculate progress analytics
    const now = new Date();
    const startDate = goal.createdAt;
    const targetDate = new Date(goal.targetDate);

    // Calculate time-based metrics
    const totalDays = Math.ceil(
      (targetDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    const daysPassed = Math.ceil(
      (now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    const daysRemaining = Math.max(
      0,
      Math.ceil((targetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    );

    // Calculate progress rate
    const expectedProgress = totalDays > 0 ? (daysPassed / totalDays) * 100 : 0;
    const actualProgress = goal.percentageCompleted;
    const progressVariance = actualProgress - expectedProgress;

    // Calculate required daily savings
    const remainingAmount = goal.remainingAmount;
    const requiredDailySavings =
      daysRemaining > 0 ? remainingAmount / daysRemaining : 0;
    const requiredMonthlySavings = requiredDailySavings * 30.44; // Average days per month

    // Get recent income and expenses for context
    const recentIncome = await Income.find({
      userId: session.user.email,
      receivedDate: {
        $gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
      }, // Last 30 days
    })
      .sort({ receivedDate: -1 })
      .limit(10)
      .select("source amount receivedDate category");

    const recentExpenses = await Expense.find({
      userId: session.user.email,
      $or: [
        {
          paymentDate: {
            $gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
          },
        },
        {
          paymentDate: { $exists: false },
          createdAt: {
            $gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
          },
        },
      ],
    })
      .populate("company", "name")
      .sort({ paymentDate: -1, createdAt: -1 })
      .limit(10)
      .select("name amount category paymentDate createdAt company");

    // Calculate milestone progress
    const milestoneProgress = goal.milestones.map((milestone) => {
      const milestoneDate = new Date(milestone.date);
      const isOverdue = milestoneDate < now && !milestone.achieved;
      const daysUntilMilestone = Math.ceil(
        (milestoneDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      return {
        ...milestone.toObject(),
        isOverdue,
        daysUntilMilestone,
        progress:
          goal.currentAmount >= milestone.amount
            ? 100
            : (goal.currentAmount / milestone.amount) * 100,
      };
    });

    // Calculate goal health metrics
    const isOnTrack = progressVariance >= -5; // Within 5% of expected progress
    const isAhead = progressVariance > 5;
    const isBehind = progressVariance < -5;
    const isAtRisk = daysRemaining < 30 && actualProgress < 80; // Less than 30 days and less than 80% complete

    // Calculate savings rate analysis
    const totalIncome = recentIncome.reduce(
      (sum, income) => sum + income.amount,
      0
    );
    const totalExpenses = recentExpenses.reduce(
      (sum, expense) => sum + expense.amount,
      0
    );
    const netIncome = totalIncome - totalExpenses;
    const savingsRate = totalIncome > 0 ? (netIncome / totalIncome) * 100 : 0;

    return NextResponse.json({
      goal: {
        ...goal.toObject(),
        isOnTrack,
        isAhead,
        isBehind,
        isAtRisk,
      },
      analytics: {
        timeMetrics: {
          totalDays,
          daysPassed,
          daysRemaining,
          expectedProgress,
          actualProgress,
          progressVariance,
        },
        savingsMetrics: {
          requiredDailySavings,
          requiredMonthlySavings,
          currentSavingsRate: savingsRate,
          netIncome,
          totalIncome,
          totalExpenses,
        },
        milestoneProgress,
        recentIncome,
        recentExpenses,
      },
    });
  } catch (error) {
    console.error("Error fetching goal analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch goal analytics" },
      { status: 500 }
    );
  }
}
