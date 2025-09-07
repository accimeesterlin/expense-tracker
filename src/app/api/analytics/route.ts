import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import Expense from "@/models/Expense";
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, startOfYear, endOfYear, subDays, subMonths } from "date-fns";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "month"; // month, week, year, custom
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // Calculate date ranges based on period
    const now = new Date();
    let dateFilter: any = {};

    switch (period) {
      case "week":
        dateFilter = {
          createdAt: {
            $gte: startOfWeek(now),
            $lte: endOfWeek(now)
          }
        };
        break;
      case "month":
        dateFilter = {
          createdAt: {
            $gte: startOfMonth(now),
            $lte: endOfMonth(now)
          }
        };
        break;
      case "year":
        dateFilter = {
          createdAt: {
            $gte: startOfYear(now),
            $lte: endOfYear(now)
          }
        };
        break;
      case "custom":
        if (startDate && endDate) {
          dateFilter = {
            createdAt: {
              $gte: new Date(startDate),
              $lte: new Date(endDate)
            }
          };
        }
        break;
      default:
        dateFilter = {
          createdAt: {
            $gte: startOfMonth(now),
            $lte: endOfMonth(now)
          }
        };
    }

    const baseFilter = { userId: session.user.id, ...dateFilter };

    // Get total expenses
    const totalExpensesResult = await Expense.aggregate([
      { $match: baseFilter },
      {
        $group: {
          _id: null,
          total: { $sum: "$amount" },
          count: { $sum: 1 },
          avgAmount: { $avg: "$amount" }
        }
      }
    ]);

    const totalExpenses = totalExpensesResult[0] || { total: 0, count: 0, avgAmount: 0 };

    // Get expenses by category
    const expensesByCategory = await Expense.aggregate([
      { $match: baseFilter },
      {
        $group: {
          _id: "$category",
          total: { $sum: "$amount" },
          count: { $sum: 1 }
        }
      },
      { $sort: { total: -1 } }
    ]);

    // Get expenses by type
    const expensesByType = await Expense.aggregate([
      { $match: baseFilter },
      {
        $group: {
          _id: "$expenseType",
          total: { $sum: "$amount" },
          count: { $sum: 1 }
        }
      },
      { $sort: { total: -1 } }
    ]);

    // Get daily expenses for the period
    const dailyExpenses = await Expense.aggregate([
      { $match: baseFilter },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
            day: { $dayOfMonth: "$createdAt" }
          },
          total: { $sum: "$amount" },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } }
    ]);

    // Get monthly trend (last 12 months)
    const monthlyTrend = await Expense.aggregate([
      {
        $match: {
          userId: session.user.id,
          createdAt: {
            $gte: subMonths(now, 12),
            $lte: now
          }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" }
          },
          total: { $sum: "$amount" },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } }
    ]);

    // Get top companies by spending
    const topCompanies = await Expense.aggregate([
      { $match: baseFilter },
      {
        $lookup: {
          from: "companies",
          localField: "company",
          foreignField: "_id",
          as: "companyInfo"
        }
      },
      { $unwind: "$companyInfo" },
      {
        $group: {
          _id: "$company",
          name: { $first: "$companyInfo.name" },
          total: { $sum: "$amount" },
          count: { $sum: 1 }
        }
      },
      { $sort: { total: -1 } },
      { $limit: 10 }
    ]);

    // Get recent large expenses
    const largeExpenses = await Expense.find(baseFilter)
      .sort({ amount: -1 })
      .limit(5)
      .populate("company", "name")
      .select("name amount category company createdAt");

    // Compare with previous period
    let previousPeriodFilter: any = {};
    switch (period) {
      case "week":
        const prevWeekStart = subDays(startOfWeek(now), 7);
        const prevWeekEnd = subDays(endOfWeek(now), 7);
        previousPeriodFilter = {
          userId: session.user.id,
          createdAt: {
            $gte: prevWeekStart,
            $lte: prevWeekEnd
          }
        };
        break;
      case "month":
        const prevMonth = subMonths(now, 1);
        previousPeriodFilter = {
          userId: session.user.id,
          createdAt: {
            $gte: startOfMonth(prevMonth),
            $lte: endOfMonth(prevMonth)
          }
        };
        break;
      case "year":
        const prevYear = new Date(now.getFullYear() - 1, 0, 1);
        const prevYearEnd = new Date(now.getFullYear() - 1, 11, 31);
        previousPeriodFilter = {
          userId: session.user.id,
          createdAt: {
            $gte: prevYear,
            $lte: prevYearEnd
          }
        };
        break;
    }

    let previousPeriodTotal = 0;
    if (Object.keys(previousPeriodFilter).length > 0) {
      const prevPeriodResult = await Expense.aggregate([
        { $match: previousPeriodFilter },
        {
          $group: {
            _id: null,
            total: { $sum: "$amount" }
          }
        }
      ]);
      previousPeriodTotal = prevPeriodResult[0]?.total || 0;
    }

    const percentageChange = previousPeriodTotal > 0 
      ? ((totalExpenses.total - previousPeriodTotal) / previousPeriodTotal) * 100 
      : 0;

    return NextResponse.json({
      summary: {
        ...totalExpenses,
        previousPeriodTotal,
        percentageChange: Math.round(percentageChange * 100) / 100,
        period
      },
      charts: {
        expensesByCategory,
        expensesByType,
        dailyExpenses,
        monthlyTrend
      },
      insights: {
        topCompanies,
        largeExpenses
      }
    });
  } catch (error) {
    console.error("Error fetching analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}