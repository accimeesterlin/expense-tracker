import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import Expense from "@/models/Expense";
import Company from "@/models/Company";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");
    const type = searchParams.get("type") || "all"; // all, expenses, companies
    const category = searchParams.get("category");
    const expenseType = searchParams.get("expenseType");
    const minAmount = searchParams.get("minAmount");
    const maxAmount = searchParams.get("maxAmount");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");

    const results: {
      expenses: Array<{
        _id: string;
        name: string;
        amount: number;
        category: string;
        company: { name: string };
        createdAt: string;
      }>;
      companies: Array<{
        _id: string;
        name: string;
        industry: string;
        createdAt: string;
      }>;
      total: number;
      metadata: {
        query: string;
        filters: {
          startDate?: string;
          endDate?: string;
          category?: string;
          company?: string;
          expenseType?: string;
          minAmount?: string;
          maxAmount?: string;
        };
        pagination: {
          limit: number;
          offset: number;
          hasMore: boolean;
        };
      };
    } = {
      expenses: [],
      companies: [],
      total: 0,
      metadata: {
        query: query || "",
        filters: {
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          category: category || undefined,
          company: undefined,
        },
        pagination: {
          limit,
          offset,
          hasMore: false,
        },
      },
    };

    if (
      !query &&
      !category &&
      !expenseType &&
      !minAmount &&
      !maxAmount &&
      !startDate &&
      !endDate
    ) {
      return NextResponse.json(results);
    }

    // Build search filters
    const searchFilters: Record<string, unknown> = { userId: session.user.id };

    // Text search
    if (query) {
      const searchRegex = new RegExp(query, "i");
      searchFilters.$or = [
        { name: searchRegex },
        { description: searchRegex },
        { category: searchRegex },
        { tags: { $in: [searchRegex] } },
      ];
    }

    // Category filter
    if (category) {
      searchFilters.category = category;
    }

    // Expense type filter
    if (expenseType) {
      searchFilters.expenseType = expenseType;
    }

    // Amount range filter
    if (minAmount || maxAmount) {
      searchFilters.amount = {};
      if (minAmount) {
        (searchFilters.amount as { $gte?: number }).$gte = parseFloat(minAmount);
      }
      if (maxAmount) {
        (searchFilters.amount as { $lte?: number }).$lte = parseFloat(maxAmount);
      }
    }

    // Date range filter
    if (startDate || endDate) {
      searchFilters.createdAt = {};
      if (startDate) {
        (searchFilters.createdAt as { $gte?: Date }).$gte = new Date(startDate);
      }
      if (endDate) {
        (searchFilters.createdAt as { $lte?: Date }).$lte = new Date(endDate);
      }
    }

    if (type === "expenses" || type === "all") {
      // Search expenses
      const expenses = await Expense.find(searchFilters)
        .populate("company", "name industry")
        .sort({ createdAt: -1 })
        .skip(offset)
        .limit(limit);

      results.expenses = expenses;

      // Get total count for pagination
      results.total = await Expense.countDocuments(searchFilters);
    }

    if (type === "companies" || type === "all") {
      // Search companies
      const companyFilters: Record<string, unknown> = { userId: session.user.id };

      if (query) {
        const searchRegex = new RegExp(query, "i");
        companyFilters.$or = [
          { name: searchRegex },
          { industry: searchRegex },
          { "address.city": searchRegex },
          { "address.state": searchRegex },
          { "contactInfo.email": searchRegex },
        ];
      }

      const companies = await Company.find(companyFilters)
        .sort({ name: 1 })
        .limit(type === "companies" ? limit : 10); // Limit companies when searching all

      results.companies = companies;
    }

    // Add search metadata
    results.metadata = {
      query: query || "",
      filters: {
        category: category || undefined,
        expenseType: expenseType || undefined,
        minAmount: minAmount || undefined,
        maxAmount: maxAmount || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      },
      pagination: {
        limit,
        offset,
        hasMore: results.total > offset + limit,
      },
    };

    return NextResponse.json(results);
  } catch (error) {
    console.error("Error searching:", error);
    return NextResponse.json({ error: "Failed to search" }, { status: 500 });
  }
}
