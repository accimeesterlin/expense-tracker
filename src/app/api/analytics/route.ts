import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import Expense from "@/models/Expense";
import { ensureModelsRegistered } from "@/lib/models";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  startOfYear,
  endOfYear,
  startOfDay,
  endOfDay,
  subDays,
  subMonths,
  subYears,
} from "date-fns";

export async function GET(request: NextRequest) {
  try {
    // Ensure models are registered before proceeding
    ensureModelsRegistered();
    
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "month"; // month, week, year, custom
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // Calculate date ranges based on period, using paymentDate if available, otherwise createdAt
    const now = new Date();
    let dateFilter: any = {};

    switch (period) {
      case "today":
        dateFilter = {
          $or: [
            {
              paymentDate: {
                $gte: startOfDay(now),
                $lte: endOfDay(now),
              },
            },
            {
              paymentDate: { $exists: false },
              createdAt: {
                $gte: startOfDay(now),
                $lte: endOfDay(now),
              },
            },
          ],
        };
        break;
      case "week":
        dateFilter = {
          $or: [
            {
              paymentDate: {
                $gte: startOfWeek(now),
                $lte: endOfWeek(now),
              },
            },
            {
              paymentDate: { $exists: false },
              createdAt: {
                $gte: startOfWeek(now),
                $lte: endOfWeek(now),
              },
            },
          ],
        };
        break;
      case "month":
        dateFilter = {
          $or: [
            {
              paymentDate: {
                $gte: startOfMonth(now),
                $lte: endOfMonth(now),
              },
            },
            {
              paymentDate: { $exists: false },
              createdAt: {
                $gte: startOfMonth(now),
                $lte: endOfMonth(now),
              },
            },
          ],
        };
        break;
      case "year":
        dateFilter = {
          $or: [
            {
              paymentDate: {
                $gte: startOfYear(now),
                $lte: endOfYear(now),
              },
            },
            {
              paymentDate: { $exists: false },
              createdAt: {
                $gte: startOfYear(now),
                $lte: endOfYear(now),
              },
            },
          ],
        };
        break;
      case "lastYear":
        const lastYearStart = startOfYear(subYears(now, 1));
        const lastYearEnd = endOfYear(subYears(now, 1));
        dateFilter = {
          $or: [
            {
              paymentDate: {
                $gte: lastYearStart,
                $lte: lastYearEnd,
              },
            },
            {
              paymentDate: { $exists: false },
              createdAt: {
                $gte: lastYearStart,
                $lte: lastYearEnd,
              },
            },
          ],
        };
        break;
      case "lastMonth":
        const lastMonthStart = startOfMonth(subMonths(now, 1));
        const lastMonthEnd = endOfMonth(subMonths(now, 1));
        dateFilter = {
          $or: [
            {
              paymentDate: {
                $gte: lastMonthStart,
                $lte: lastMonthEnd,
              },
            },
            {
              paymentDate: { $exists: false },
              createdAt: {
                $gte: lastMonthStart,
                $lte: lastMonthEnd,
              },
            },
          ],
        };
        break;
      case "lastWeek":
        const lastWeekStart = startOfWeek(subDays(now, 7));
        const lastWeekEnd = endOfWeek(subDays(now, 7));
        dateFilter = {
          $or: [
            {
              paymentDate: {
                $gte: lastWeekStart,
                $lte: lastWeekEnd,
              },
            },
            {
              paymentDate: { $exists: false },
              createdAt: {
                $gte: lastWeekStart,
                $lte: lastWeekEnd,
              },
            },
          ],
        };
        break;
      case "custom":
        if (startDate && endDate) {
          dateFilter = {
            $or: [
              {
                paymentDate: {
                  $gte: new Date(startDate),
                  $lte: new Date(endDate),
                },
              },
              {
                paymentDate: { $exists: false },
                createdAt: {
                  $gte: new Date(startDate),
                  $lte: new Date(endDate),
                },
              },
            ],
          };
        }
        break;
      default:
        dateFilter = {
          $or: [
            {
              paymentDate: {
                $gte: startOfMonth(now),
                $lte: endOfMonth(now),
              },
            },
            {
              paymentDate: { $exists: false },
              createdAt: {
                $gte: startOfMonth(now),
                $lte: endOfMonth(now),
              },
            },
          ],
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
          avgAmount: { $avg: "$amount" },
        },
      },
    ]);

    const totalExpenses = totalExpensesResult[0] || {
      total: 0,
      count: 0,
      avgAmount: 0,
    };

    // Get expenses by category
    const expensesByCategory = await Expense.aggregate([
      { $match: baseFilter },
      {
        $group: {
          _id: "$category",
          total: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
      { $sort: { total: -1 } },
    ]);

    // Get expenses by type
    const expensesByType = await Expense.aggregate([
      { $match: baseFilter },
      {
        $group: {
          _id: "$expenseType",
          total: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
      { $sort: { total: -1 } },
    ]);

    // Get expenses by tags
    const expensesByTags = await Expense.aggregate([
      { $match: baseFilter },
      { $unwind: { path: "$tags", preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: "$tags",
          total: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
      { $match: { _id: { $ne: null, $ne: "" } } },
      { $sort: { total: -1 } },
      { $limit: 10 },
    ]);

    // Get daily expenses for the period using paymentDate when available
    const dailyExpenses = await Expense.aggregate([
      { $match: baseFilter },
      {
        $addFields: {
          effectiveDate: {
            $ifNull: ["$paymentDate", "$createdAt"],
          },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$effectiveDate" },
            month: { $month: "$effectiveDate" },
            day: { $dayOfMonth: "$effectiveDate" },
          },
          total: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } },
    ]);

    // Get monthly trend (last 12 months) using paymentDate when available
    const monthlyTrend = await Expense.aggregate([
      {
        $match: {
          userId: session.user.id,
          $or: [
            {
              paymentDate: {
                $gte: subMonths(now, 12),
                $lte: now,
              },
            },
            {
              paymentDate: { $exists: false },
              createdAt: {
                $gte: subMonths(now, 12),
                $lte: now,
              },
            },
          ],
        },
      },
      {
        $addFields: {
          effectiveDate: {
            $ifNull: ["$paymentDate", "$createdAt"],
          },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$effectiveDate" },
            month: { $month: "$effectiveDate" },
          },
          total: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    // Get top companies by spending
    const topCompanies = await Expense.aggregate([
      { $match: baseFilter },
      {
        $lookup: {
          from: "companies",
          localField: "company",
          foreignField: "_id",
          as: "companyInfo",
        },
      },
      { $unwind: "$companyInfo" },
      {
        $group: {
          _id: "$company",
          name: { $first: "$companyInfo.name" },
          total: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
      { $sort: { total: -1 } },
      { $limit: 10 },
    ]);

    // Get recent large expenses
    const largeExpenses = await Expense.find(baseFilter)
      .sort({ amount: -1 })
      .limit(5)
      .populate("company", "name")
      .select("name amount category company createdAt");

    // Get detailed category insights
    const categoryInsights = await Expense.aggregate([
      { $match: baseFilter },
      {
        $group: {
          _id: "$category",
          total: { $sum: "$amount" },
          count: { $sum: 1 },
          avgAmount: { $avg: "$amount" },
          maxAmount: { $max: "$amount" },
          minAmount: { $min: "$amount" },
        },
      },
      { $sort: { total: -1 } },
      { $limit: 10 },
    ]);

    // Compare with previous period
    let previousPeriodFilter: {
      userId?: string;
      createdAt?: { $gte: Date; $lte: Date };
    } = {};
    switch (period) {
      case "today":
        const prevDay = subDays(now, 1);
        previousPeriodFilter = {
          userId: session.user.id,
          createdAt: {
            $gte: startOfDay(prevDay),
            $lte: endOfDay(prevDay),
          },
        };
        break;
      case "week":
        const prevWeekStart = subDays(startOfWeek(now), 7);
        const prevWeekEnd = subDays(endOfWeek(now), 7);
        previousPeriodFilter = {
          userId: session.user.id,
          createdAt: {
            $gte: prevWeekStart,
            $lte: prevWeekEnd,
          },
        };
        break;
      case "month":
        const prevMonth = subMonths(now, 1);
        previousPeriodFilter = {
          userId: session.user.id,
          createdAt: {
            $gte: startOfMonth(prevMonth),
            $lte: endOfMonth(prevMonth),
          },
        };
        break;
      case "year":
        const prevYear = new Date(now.getFullYear() - 1, 0, 1);
        const prevYearEnd = new Date(now.getFullYear() - 1, 11, 31);
        previousPeriodFilter = {
          userId: session.user.id,
          createdAt: {
            $gte: prevYear,
            $lte: prevYearEnd,
          },
        };
        break;
      case "lastYear":
        const prevLastYear = subYears(now, 2);
        previousPeriodFilter = {
          userId: session.user.id,
          createdAt: {
            $gte: startOfYear(prevLastYear),
            $lte: endOfYear(prevLastYear),
          },
        };
        break;
      case "lastMonth":
        const prevLastMonth = subMonths(now, 2);
        previousPeriodFilter = {
          userId: session.user.id,
          createdAt: {
            $gte: startOfMonth(prevLastMonth),
            $lte: endOfMonth(prevLastMonth),
          },
        };
        break;
      case "lastWeek":
        const prevLastWeekStart = subDays(now, 14);
        const prevLastWeekEnd = subDays(now, 8);
        previousPeriodFilter = {
          userId: session.user.id,
          createdAt: {
            $gte: startOfWeek(prevLastWeekStart),
            $lte: endOfWeek(prevLastWeekEnd),
          },
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
            total: { $sum: "$amount" },
          },
        },
      ]);
      previousPeriodTotal = prevPeriodResult[0]?.total || 0;
    }

    const percentageChange =
      previousPeriodTotal > 0
        ? ((totalExpenses.total - previousPeriodTotal) / previousPeriodTotal) *
          100
        : 0;

    return NextResponse.json({
      summary: {
        ...totalExpenses,
        previousPeriodTotal,
        percentageChange: Math.round(percentageChange * 100) / 100,
        period,
      },
      charts: {
        expensesByCategory,
        expensesByType,
        expensesByTags,
        dailyExpenses,
        monthlyTrend,
      },
      insights: {
        topCompanies,
        largeExpenses,
        categoryInsights,
      },
    });
  } catch (error) {
    console.error("Error fetching analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}
