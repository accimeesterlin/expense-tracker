"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useApiClient } from "@/hooks/useApiClient";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  CreditCard,
  Calendar,
  Building2,
  BarChart3,
} from "lucide-react";
import AppLayout from "@/components/AppLayout";

interface AnalyticsData {
  summary: {
    total: number;
    count: number;
    avgAmount: number;
    previousPeriodTotal: number;
    percentageChange: number;
    period: string;
  };
  charts: {
    expensesByCategory: Array<{ _id: string; total: number; count: number }>;
    expensesByType: Array<{ _id: string; total: number; count: number }>;
    expensesByTags: Array<{ _id: string; total: number; count: number }>;
    dailyExpenses: Array<{
      _id: { year: number; month: number; day: number };
      total: number;
      count: number;
    }>;
    monthlyTrend: Array<{
      _id: { year: number; month: number };
      total: number;
      count: number;
    }>;
  };
  insights: {
    topCompanies: Array<{
      _id: string;
      name: string;
      total: number;
      count: number;
    }>;
    largeExpenses: Array<{
      _id: string;
      name: string;
      amount: number;
      category: string;
      company: { name: string };
    }>;
    categoryInsights: Array<{
      _id: string;
      total: number;
      count: number;
      avgAmount: number;
      maxAmount: number;
      minAmount: number;
    }>;
  };
}

const COLORS = [
  "#006BFF",
  "#00C7BE",
  "#FF6B6B",
  "#4ECDC4",
  "#45B7D1",
  "#FFA07A",
  "#98D8C8",
  "#F7DC6F",
  "#BB8FCE",
  "#85C1E9",
  "#F8C471",
  "#82E0AA",
];

export default function AnalyticsPage() {
  const { status } = useSession();
  const router = useRouter();
  const api = useApiClient();
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState("month");
  const [error, setError] = useState("");

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await api.getAnalytics({ period: selectedPeriod });
      if (result) {
        setAnalyticsData(result);
      } else {
        setError("Failed to load analytics data");
      }
    } catch (error) {
      console.error("Error fetching analytics:", error);
      setError("Failed to load analytics data");
    } finally {
      setLoading(false);
    }
  }, [selectedPeriod, api]);

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated") {
      router.push("/auth/signin");
      return;
    }
    fetchAnalytics();
  }, [status, selectedPeriod, router, fetchAnalytics]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatDate = (dateObj: {
    year: number;
    month: number;
    day?: number;
  }) => {
    if (dateObj.day) {
      return `${dateObj.month}/${dateObj.day}`;
    }
    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    return monthNames[dateObj.month - 1];
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-[#F8F9FB] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#006BFF]"></div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return null;
  }

  if (error || !analyticsData) {
    return (
      <div className="min-h-screen bg-[#F8F9FB] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">
            {error || "Failed to load analytics"}
          </h1>
          <button
            onClick={() => router.push("/")}
            className="text-[#006BFF] hover:text-[#0052CC] font-medium"
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const { summary, charts, insights } = analyticsData;

  return (
    <AppLayout title="Analytics">
      <div className="w-full overflow-x-hidden">
        <div className="flex items-center justify-end mb-4 sm:mb-8">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="input-field text-sm sm:text-base"
          >
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="year">This Year</option>
            <option value="lastWeek">Last Week</option>
            <option value="lastMonth">Last Month</option>
            <option value="lastYear">Last Year</option>
          </select>
        </div>
        {/* Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-4 sm:mb-6 lg:mb-8">
          <div className="card p-3 sm:p-4 lg:p-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-[#476788]">
                  Total Spent
                </p>
                <p
                  className="text-xl sm:text-3xl font-bold text-[#0B3558] truncate"
                  title={formatCurrency(summary.total)}
                >
                  {formatCurrency(summary.total)}
                </p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#006BFF]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-[#006BFF]" />
              </div>
            </div>
            {summary.percentageChange !== 0 && (
              <div className="flex items-center mt-2">
                {summary.percentageChange > 0 ? (
                  <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-red-500 mr-1 flex-shrink-0" />
                ) : (
                  <TrendingDown className="w-3 h-3 sm:w-4 sm:h-4 text-green-500 mr-1 flex-shrink-0" />
                )}
                <span
                  className={`text-xs sm:text-sm ${
                    summary.percentageChange > 0
                      ? "text-red-600"
                      : "text-green-600"
                  } truncate`}
                >
                  {Math.abs(summary.percentageChange)}% vs last {summary.period}
                </span>
              </div>
            )}
          </div>

          <div className="card p-3 sm:p-4 lg:p-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-[#476788]">
                  Total Expenses
                </p>
                <p className="text-xl sm:text-3xl font-bold text-[#0B3558]">
                  {summary.count}
                </p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#00C7BE]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <CreditCard className="w-5 h-5 sm:w-6 sm:h-6 text-[#00C7BE]" />
              </div>
            </div>
          </div>

          <div className="card p-3 sm:p-4 lg:p-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-[#476788]">
                  Average Amount
                </p>
                <p
                  className="text-xl sm:text-3xl font-bold text-[#0B3558] truncate"
                  title={formatCurrency(summary.avgAmount)}
                >
                  {formatCurrency(summary.avgAmount)}
                </p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#FF6B6B]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6 text-[#FF6B6B]" />
              </div>
            </div>
          </div>

          <div className="card p-3 sm:p-4 lg:p-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-[#476788]">
                  Period
                </p>
                <p className="text-lg sm:text-2xl font-bold text-[#0B3558] capitalize">
                  {summary.period}
                </p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#4ECDC4]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-[#4ECDC4]" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {/* Expenses by Category */}
          <div className="card p-3 sm:p-4 lg:p-6">
            <h3 className="text-base sm:text-lg font-semibold text-[#0B3558] mb-3 sm:mb-4">
              Expenses by Category
            </h3>
            <div className="h-64 sm:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={charts.expensesByCategory}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ _id, total }) =>
                      `${_id}: ${formatCurrency(total)}`
                    }
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="total"
                  >
                    {charts.expensesByCategory.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Expenses by Type */}
          <div className="card p-3 sm:p-4 lg:p-6">
            <h3 className="text-base sm:text-lg font-semibold text-[#0B3558] mb-3 sm:mb-4">
              Expenses by Type
            </h3>
            <div className="h-64 sm:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.expensesByType}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="_id" />
                  <YAxis />
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                  />
                  <Bar dataKey="total" fill="#006BFF" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {/* Monthly Trend */}
          <div className="card p-3 sm:p-4 lg:p-6">
            <h3 className="text-base sm:text-lg font-semibold text-[#0B3558] mb-3 sm:mb-4">
              Monthly Trend (Last 12 Months)
            </h3>
            <div className="h-64 sm:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={charts.monthlyTrend.map((item) => ({
                    ...item,
                    date: formatDate(item._id),
                  }))}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                  />
                  <Line
                    type="monotone"
                    dataKey="total"
                    stroke="#006BFF"
                    strokeWidth={2}
                    dot={{ fill: "#006BFF" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Daily Expenses */}
          <div className="card p-3 sm:p-4 lg:p-6">
            <h3 className="text-base sm:text-lg font-semibold text-[#0B3558] mb-3 sm:mb-4">
              Daily Expenses
            </h3>
            <div className="h-64 sm:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={charts.dailyExpenses.map((item) => ({
                    ...item,
                    date: formatDate(item._id),
                  }))}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                  />
                  <Bar dataKey="total" fill="#00C7BE" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Expenses by Tags */}
        {charts.expensesByTags && charts.expensesByTags.length > 0 && (
          <div className="card p-3 sm:p-4 lg:p-6 mb-6 sm:mb-8">
            <h3 className="text-base sm:text-lg font-semibold text-[#0B3558] mb-3 sm:mb-4">
              Expenses by Tags
            </h3>
            <div className="h-64 sm:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.expensesByTags}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="_id" />
                  <YAxis />
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                  />
                  <Bar dataKey="total" fill="#4ECDC4" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {/* Top Companies */}
          <div className="card p-3 sm:p-4 lg:p-6">
            <h3 className="text-base sm:text-lg font-semibold text-[#0B3558] mb-3 sm:mb-4">
              Top Companies by Spending
            </h3>
            <div className="space-y-2 sm:space-y-3">
              {insights.topCompanies.map((company) => (
                <div
                  key={company._id}
                  className="flex items-center justify-between p-2 sm:p-3 bg-[#F8F9FB] rounded-lg"
                >
                  <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
                    <div className="w-6 h-6 sm:w-8 sm:h-8 bg-[#006BFF]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Building2 className="w-3 h-3 sm:w-4 sm:h-4 text-[#006BFF]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-[#0B3558] text-sm sm:text-base truncate">
                        {company.name}
                      </p>
                      <p className="text-xs sm:text-sm text-[#476788]">
                        {company.count} expenses
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-2">
                    <p
                      className="font-bold text-[#0B3558] text-sm sm:text-base truncate"
                      title={formatCurrency(company.total)}
                    >
                      {formatCurrency(company.total)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Large Expenses */}
          <div className="card p-3 sm:p-4 lg:p-6">
            <h3 className="text-base sm:text-lg font-semibold text-[#0B3558] mb-3 sm:mb-4">
              Largest Expenses
            </h3>
            <div className="space-y-2 sm:space-y-3">
              {insights.largeExpenses.map((expense) => (
                <div
                  key={expense._id}
                  className="flex items-center justify-between p-2 sm:p-3 bg-[#F8F9FB] rounded-lg"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-[#0B3558] text-sm sm:text-base truncate">
                      {expense.name}
                    </p>
                    <p className="text-xs sm:text-sm text-[#476788] truncate">
                      {expense.company.name} • {expense.category}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0 ml-2">
                    <p
                      className="font-bold text-[#0B3558] text-sm sm:text-base truncate"
                      title={formatCurrency(expense.amount)}
                    >
                      {formatCurrency(expense.amount)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Category Insights */}
        {insights.categoryInsights && insights.categoryInsights.length > 0 && (
          <div className="card p-3 sm:p-4 lg:p-6">
            <h3 className="text-base sm:text-lg font-semibold text-[#0B3558] mb-3 sm:mb-4">
              Category Insights
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {insights.categoryInsights.map((category) => (
                <div
                  key={category._id}
                  className="p-3 sm:p-4 bg-[#F8F9FB] rounded-lg"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-[#0B3558] text-sm sm:text-base truncate">
                      {category._id}
                    </h4>
                    <div className="w-6 h-6 sm:w-8 sm:h-8 bg-[#00C7BE]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <BarChart3 className="w-3 h-3 sm:w-4 sm:h-4 text-[#00C7BE]" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs sm:text-sm">
                      <span className="text-[#476788]">Total:</span>
                      <span className="font-medium text-[#0B3558]">
                        {formatCurrency(category.total)}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs sm:text-sm">
                      <span className="text-[#476788]">Count:</span>
                      <span className="font-medium text-[#0B3558]">
                        {category.count} expenses
                      </span>
                    </div>
                    <div className="flex justify-between text-xs sm:text-sm">
                      <span className="text-[#476788]">Average:</span>
                      <span className="font-medium text-[#0B3558]">
                        {formatCurrency(category.avgAmount)}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs sm:text-sm">
                      <span className="text-[#476788]">Range:</span>
                      <span className="font-medium text-[#0B3558]">
                        {formatCurrency(category.minAmount)} -{" "}
                        {formatCurrency(category.maxAmount)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
