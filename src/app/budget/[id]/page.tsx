"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft,
  DollarSign,
  Calendar,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  RefreshCw,
} from "lucide-react";
import AppLayout from "@/components/AppLayout";
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
} from "recharts";

interface BudgetAnalytics {
  budget: {
    _id: string;
    name: string;
    description?: string;
    totalAmount: number;
    spentAmount: number;
    actualSpent: number;
    remainingAmount: number;
    percentageUsed: number;
    isOverBudget: boolean;
    isNearLimit: boolean;
    expenseCount: number;
    currency: string;
    category?: string;
    period: string;
    startDate: string;
    endDate: string;
    alertThreshold: number;
  };
  analytics: {
    categoryBreakdown: Array<{
      _id: string;
      total: number;
      count: number;
    }>;
    recentExpenses: Array<{
      _id: string;
      name: string;
      amount: number;
      category: string;
      paymentDate?: string;
      createdAt: string;
      company: { name: string };
    }>;
    dailySpendingRate: number;
    projectedTotal: number;
    daysPassed: number;
    totalDays: number;
    daysRemaining: number;
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

export default function BudgetDetailPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const [analytics, setAnalytics] = useState<BudgetAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState("");

  const fetchAnalytics = useCallback(async () => {
    try {
      const response = await fetch(`/api/budgets/${params.id}/analytics`);
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      } else {
        setError("Failed to load budget analytics");
      }
    } catch (error) {
      console.error("Error fetching budget analytics:", error);
      setError("Failed to load budget analytics");
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  const syncBudget = async () => {
    setSyncing(true);
    try {
      const response = await fetch("/api/budgets/sync", {
        method: "POST",
      });
      if (response.ok) {
        // Refresh analytics after sync
        await fetchAnalytics();
      }
    } catch (error) {
      console.error("Error syncing budget:", error);
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/auth/signin");
      return;
    }
    fetchAnalytics();
  }, [session, status, router, fetchAnalytics]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (status === "loading" || loading) {
    return (
      <AppLayout title="Loading...">
        <div className="flex items-center justify-center min-h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#006BFF]"></div>
        </div>
      </AppLayout>
    );
  }

  if (!session) {
    return null;
  }

  if (error || !analytics) {
    return (
      <AppLayout title="Error">
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">
              {error || "Budget not found"}
            </h1>
            <button
              onClick={() => router.push("/budget")}
              className="text-[#006BFF] hover:text-[#0052CC] font-medium"
            >
              ← Back to Budgets
            </button>
          </div>
        </div>
      </AppLayout>
    );
  }

  const { budget, analytics: analyticsData } = analytics;

  return (
    <AppLayout title="Budget Analytics">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-8">
          <div className="flex items-center space-x-2 sm:space-x-4 min-w-0 flex-1">
            <button
              onClick={() => router.push("/budget")}
              className="text-[#476788] hover:text-[#0B3558] transition-colors flex-shrink-0"
            >
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-[#006BFF] rounded-xl flex items-center justify-center flex-shrink-0">
                <DollarSign className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
              </div>
              <h1 className="text-lg sm:text-xl lg:text-2xl font-semibold text-[#0B3558] truncate">
                {budget.name}
              </h1>
            </div>
          </div>
          <div className="flex items-center space-x-2 w-full sm:w-auto justify-end flex-shrink-0">
            <button
              onClick={syncBudget}
              disabled={syncing}
              className="btn-secondary inline-flex items-center space-x-2 text-sm sm:text-base flex-1 sm:flex-none justify-center"
            >
              <RefreshCw
                className={`w-4 h-4 ${syncing ? "animate-spin" : ""}`}
              />
              <span>{syncing ? "Syncing..." : "Sync"}</span>
            </button>
          </div>
        </div>

        {/* Budget Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {/* Total Budget */}
          <div className="card p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#476788]">
                  Total Budget
                </p>
                <p className="text-2xl font-bold text-[#0B3558]">
                  {formatCurrency(budget.totalAmount)}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          {/* Spent Amount */}
          <div className="card p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#476788]">Spent</p>
                <p className="text-2xl font-bold text-[#0B3558]">
                  {formatCurrency(budget.actualSpent)}
                </p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <TrendingDown className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>

          {/* Remaining Amount */}
          <div className="card p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#476788]">Remaining</p>
                <p
                  className={`text-2xl font-bold ${
                    budget.remainingAmount >= 0
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {formatCurrency(budget.remainingAmount)}
                </p>
              </div>
              <div
                className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                  budget.remainingAmount >= 0 ? "bg-green-100" : "bg-red-100"
                }`}
              >
                {budget.remainingAmount >= 0 ? (
                  <CheckCircle className="w-6 h-6 text-green-600" />
                ) : (
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                )}
              </div>
            </div>
          </div>

          {/* Usage Percentage */}
          <div className="card p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#476788]">Usage</p>
                <p
                  className={`text-2xl font-bold ${
                    budget.isOverBudget
                      ? "text-red-600"
                      : budget.isNearLimit
                      ? "text-yellow-600"
                      : "text-green-600"
                  }`}
                >
                  {budget.percentageUsed.toFixed(1)}%
                </p>
              </div>
              <div
                className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                  budget.isOverBudget
                    ? "bg-red-100"
                    : budget.isNearLimit
                    ? "bg-yellow-100"
                    : "bg-green-100"
                }`}
              >
                <BarChart3
                  className={`w-6 h-6 ${
                    budget.isOverBudget
                      ? "text-red-600"
                      : budget.isNearLimit
                      ? "text-yellow-600"
                      : "text-green-600"
                  }`}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="card p-4 sm:p-6 mb-6 sm:mb-8">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-[#0B3558]">
              Budget Progress
            </h3>
            <span className="text-sm text-[#476788]">
              {budget.expenseCount} expenses
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className={`h-3 rounded-full transition-all duration-300 ${
                budget.isOverBudget
                  ? "bg-red-500"
                  : budget.isNearLimit
                  ? "bg-yellow-500"
                  : "bg-green-500"
              }`}
              style={{ width: `${Math.min(budget.percentageUsed, 100)}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-xs text-[#476788] mt-1">
            <span>0%</span>
            <span>{budget.alertThreshold}% Alert</span>
            <span>100%</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
          {/* Category Breakdown */}
          {analyticsData.categoryBreakdown.length > 0 && (
            <div className="card p-4 sm:p-6">
              <h3 className="text-lg font-semibold text-[#0B3558] mb-4">
                Spending by Category
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={analyticsData.categoryBreakdown}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ _id, percent }) =>
                        `${_id} ${(percent * 100).toFixed(0)}%`
                      }
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="total"
                    >
                      {analyticsData.categoryBreakdown.map((entry, index) => (
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
          )}

          {/* Spending Projection */}
          <div className="card p-4 sm:p-6">
            <h3 className="text-lg font-semibold text-[#0B3558] mb-4">
              Spending Projection
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-[#476788]">Daily Average</span>
                <span className="font-medium">
                  {formatCurrency(analyticsData.dailySpendingRate)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-[#476788]">Projected Total</span>
                <span className="font-medium">
                  {formatCurrency(analyticsData.projectedTotal)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-[#476788]">Days Remaining</span>
                <span className="font-medium">
                  {analyticsData.daysRemaining}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-[#476788]">Budget Period</span>
                <span className="font-medium">
                  {formatDate(budget.startDate)} - {formatDate(budget.endDate)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Expenses */}
        {analyticsData.recentExpenses.length > 0 && (
          <div className="card p-4 sm:p-6 mt-6 sm:mt-8">
            <h3 className="text-lg font-semibold text-[#0B3558] mb-4">
              Recent Expenses
            </h3>
            <div className="space-y-3">
              {analyticsData.recentExpenses.map((expense) => (
                <div
                  key={expense._id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex-1">
                    <p className="font-medium text-[#0B3558]">{expense.name}</p>
                    <p className="text-sm text-[#476788]">
                      {expense.company.name} • {expense.category}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-[#0B3558]">
                      {formatCurrency(expense.amount)}
                    </p>
                    <p className="text-sm text-[#476788]">
                      {formatDate(expense.paymentDate || expense.createdAt)}
                    </p>
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
