import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import { ensureModelsRegistered } from "@/lib/models";
import { createSuccessResponse, createErrorResponse, API_VERSIONS } from "@/lib/apiVersion";
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
      return NextResponse.json(
        createErrorResponse(API_VERSIONS.V1, "Unauthorized"),
        { status: 401 }
      );
    }

    await dbConnect();
    const { Expense } = ensureModelsRegistered();

    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "month";
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

    // Get all analytics data in parallel
    const [
      totalExpensesResult,
      expensesByCategory,
      expensesByType,
      expensesByTags,
      dailyExpenses,
      monthlyTrend,
      topCompanies,
      largeExpenses,
      categoryInsights
    ] = await Promise.all([
      // Total expenses
      Expense.aggregate([
        { $match: baseFilter },
        {
          $group: {
            _id: null,
            total: { $sum: "$amount" },
            count: { $sum: 1 },
            avgAmount: { $avg: "$amount" },
          },
        },
      ]),

      // Expenses by category
      Expense.aggregate([
        { $match: baseFilter },
        {
          $group: {
            _id: "$category",
            total: { $sum: "$amount" },
            count: { $sum: 1 },
          },
        },
        { $sort: { total: -1 } },
      ]),

      // Expenses by type
      Expense.aggregate([
        { $match: baseFilter },
        {
          $group: {
            _id: "$expenseType",
            total: { $sum: "$amount" },
            count: { $sum: 1 },
          },
        },
        { $sort: { total: -1 } },
      ]),

      // Expenses by tags
      Expense.aggregate([
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
      ]),

      // Daily expenses for the period
      Expense.aggregate([
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
      ]),

      // Monthly trend (last 12 months)
      Expense.aggregate([
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
      ]),

      // Top companies by spending
      Expense.aggregate([
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
      ]),

      // Recent large expenses
      Expense.find(baseFilter)
        .sort({ amount: -1 })
        .limit(5)
        .populate("company", "name")
        .select("name amount category company createdAt"),

      // Detailed category insights
      Expense.aggregate([
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
      ]),
    ]);

    const totalExpenses = totalExpensesResult[0] || {
      total: 0,
      count: 0,
      avgAmount: 0,
    };

    const analyticsData = {
      summary: {
        ...totalExpenses,
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
    };

    return NextResponse.json(
      createSuccessResponse(
        API_VERSIONS.V1,
        analyticsData,
        "Analytics data retrieved successfully"
      )
    );
  } catch (error) {
    console.error("Error fetching analytics:", error);
    return NextResponse.json(
      createErrorResponse(API_VERSIONS.V1, "Failed to fetch analytics"),
      { status: 500 }
    );
  }
}