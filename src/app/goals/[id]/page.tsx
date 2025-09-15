"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft,
  Target,
  Calendar,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  DollarSign,
  BarChart3,
  Clock,
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
  LineChart,
  Line,
} from "recharts";

interface GoalAnalytics {
  goal: {
    _id: string;
    name: string;
    description?: string;
    targetAmount: number;
    currentAmount: number;
    remainingAmount: number;
    percentageCompleted: number;
    isOnTrack: boolean;
    isAhead: boolean;
    isBehind: boolean;
    isAtRisk: boolean;
    currency: string;
    goalType: string;
    targetDate: string;
    priority: string;
    isCompleted: boolean;
    milestones: Array<{
      amount: number;
      date: string;
      achieved: boolean;
      achievedDate?: string;
      isOverdue: boolean;
      daysUntilMilestone: number;
      progress: number;
    }>;
  };
  analytics: {
    timeMetrics: {
      totalDays: number;
      daysPassed: number;
      daysRemaining: number;
      expectedProgress: number;
      actualProgress: number;
      progressVariance: number;
    };
    savingsMetrics: {
      requiredDailySavings: number;
      requiredMonthlySavings: number;
      currentSavingsRate: number;
      netIncome: number;
      totalIncome: number;
      totalExpenses: number;
    };
    milestoneProgress: Array<{
      amount: number;
      date: string;
      achieved: boolean;
      achievedDate?: string;
      isOverdue: boolean;
      daysUntilMilestone: number;
      progress: number;
    }>;
    recentIncome: Array<{
      _id: string;
      source: string;
      amount: number;
      receivedDate: string;
      category: string;
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
  };
}

export default function GoalDetailPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const [analytics, setAnalytics] = useState<GoalAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchAnalytics = useCallback(async () => {
    try {
      const response = await fetch(`/api/goals/${params.id}/analytics`);
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      } else {
        setError("Failed to load goal analytics");
      }
    } catch (error) {
      console.error("Error fetching goal analytics:", error);
      setError("Failed to load goal analytics");
    } finally {
      setLoading(false);
    }
  }, [params.id]);

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

  const getGoalTypeColor = (type: string) => {
    switch (type) {
      case "savings":
        return "bg-green-100 text-green-800";
      case "debt_payoff":
        return "bg-red-100 text-red-800";
      case "investment":
        return "bg-blue-100 text-blue-800";
      case "emergency_fund":
        return "bg-yellow-100 text-yellow-800";
      case "purchase":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "low":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
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
              {error || "Goal not found"}
            </h1>
            <button
              onClick={() => router.push("/goals")}
              className="text-[#006BFF] hover:text-[#0052CC] font-medium"
            >
              ← Back to Goals
            </button>
          </div>
        </div>
      </AppLayout>
    );
  }

  const { goal, analytics: analyticsData } = analytics;

  return (
    <AppLayout title="Goal Analytics">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-8">
          <div className="flex items-center space-x-2 sm:space-x-4 min-w-0 flex-1">
            <button
              onClick={() => router.push("/goals")}
              className="text-[#476788] hover:text-[#0B3558] transition-colors flex-shrink-0"
            >
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-[#006BFF] rounded-xl flex items-center justify-center flex-shrink-0">
                <Target className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
              </div>
              <h1 className="text-lg sm:text-xl lg:text-2xl font-semibold text-[#0B3558] truncate">
                {goal.name}
              </h1>
            </div>
          </div>
          <div className="flex items-center space-x-2 w-full sm:w-auto justify-end flex-shrink-0">
            <span
              className={`inline-flex items-center px-2.5 py-1 rounded-full text-sm font-medium ${getGoalTypeColor(
                goal.goalType
              )}`}
            >
              {goal.goalType.replace("_", " ")}
            </span>
            <span
              className={`inline-flex items-center px-2.5 py-1 rounded-full text-sm font-medium ${getPriorityColor(
                goal.priority
              )}`}
            >
              {goal.priority}
            </span>
          </div>
        </div>

        {/* Goal Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {/* Target Amount */}
          <div className="card p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#476788]">
                  Target Amount
                </p>
                <p className="text-2xl font-bold text-[#0B3558]">
                  {formatCurrency(goal.targetAmount)}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Target className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          {/* Current Amount */}
          <div className="card p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#476788]">
                  Current Amount
                </p>
                <p className="text-2xl font-bold text-[#0B3558]">
                  {formatCurrency(goal.currentAmount)}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-green-600" />
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
                    goal.remainingAmount > 0
                      ? "text-orange-600"
                      : "text-green-600"
                  }`}
                >
                  {formatCurrency(goal.remainingAmount)}
                </p>
              </div>
              <div
                className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                  goal.remainingAmount > 0 ? "bg-orange-100" : "bg-green-100"
                }`}
              >
                {goal.remainingAmount > 0 ? (
                  <TrendingUp className="w-6 h-6 text-orange-600" />
                ) : (
                  <CheckCircle className="w-6 h-6 text-green-600" />
                )}
              </div>
            </div>
          </div>

          {/* Progress Percentage */}
          <div className="card p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#476788]">Progress</p>
                <p
                  className={`text-2xl font-bold ${
                    goal.isAhead
                      ? "text-green-600"
                      : goal.isBehind
                      ? "text-red-600"
                      : "text-blue-600"
                  }`}
                >
                  {(goal.percentageCompleted || 0).toFixed(1)}%
                </p>
              </div>
              <div
                className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                  goal.isAhead
                    ? "bg-green-100"
                    : goal.isBehind
                    ? "bg-red-100"
                    : "bg-blue-100"
                }`}
              >
                <BarChart3
                  className={`w-6 h-6 ${
                    goal.isAhead
                      ? "text-green-600"
                      : goal.isBehind
                      ? "text-red-600"
                      : "text-blue-600"
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
              Goal Progress
            </h3>
            <div className="flex items-center space-x-4 text-sm text-[#476788]">
              <span>
                Expected:{" "}
                {analyticsData.timeMetrics.expectedProgress.toFixed(1)}%
              </span>
              <span>
                Actual: {analyticsData.timeMetrics.actualProgress.toFixed(1)}%
              </span>
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
            <div
              className={`h-3 rounded-full transition-all duration-300 ${
                goal.isAhead
                  ? "bg-green-500"
                  : goal.isBehind
                  ? "bg-red-500"
                  : "bg-blue-500"
              }`}
              style={{ width: `${Math.min(goal.percentageCompleted, 100)}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-xs text-[#476788]">
            <span>0%</span>
            <span>50%</span>
            <span>100%</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
          {/* Savings Metrics */}
          <div className="card p-4 sm:p-6">
            <h3 className="text-lg font-semibold text-[#0B3558] mb-4">
              Savings Metrics
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-[#476788]">
                  Required Daily Savings
                </span>
                <span className="font-medium">
                  {formatCurrency(
                    analyticsData.savingsMetrics.requiredDailySavings
                  )}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-[#476788]">
                  Required Monthly Savings
                </span>
                <span className="font-medium">
                  {formatCurrency(
                    analyticsData.savingsMetrics.requiredMonthlySavings
                  )}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-[#476788]">
                  Current Savings Rate
                </span>
                <span className="font-medium">
                  {analyticsData.savingsMetrics.currentSavingsRate.toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-[#476788]">
                  Net Income (30 days)
                </span>
                <span className="font-medium">
                  {formatCurrency(analyticsData.savingsMetrics.netIncome)}
                </span>
              </div>
            </div>
          </div>

          {/* Time Metrics */}
          <div className="card p-4 sm:p-6">
            <h3 className="text-lg font-semibold text-[#0B3558] mb-4">
              Time Metrics
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-[#476788]">Days Remaining</span>
                <span className="font-medium">
                  {analyticsData.timeMetrics.daysRemaining}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-[#476788]">Target Date</span>
                <span className="font-medium">
                  {formatDate(goal.targetDate)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-[#476788]">
                  Progress Variance
                </span>
                <span
                  className={`font-medium ${
                    analyticsData.timeMetrics.progressVariance >= 0
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {analyticsData.timeMetrics.progressVariance >= 0 ? "+" : ""}
                  {analyticsData.timeMetrics.progressVariance.toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-[#476788]">Status</span>
                <span
                  className={`font-medium ${
                    goal.isAhead
                      ? "text-green-600"
                      : goal.isBehind
                      ? "text-red-600"
                      : "text-blue-600"
                  }`}
                >
                  {goal.isAhead
                    ? "Ahead of Schedule"
                    : goal.isBehind
                    ? "Behind Schedule"
                    : "On Track"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Milestones */}
        {analyticsData.milestoneProgress.length > 0 && (
          <div className="card p-4 sm:p-6 mt-6 sm:mt-8">
            <h3 className="text-lg font-semibold text-[#0B3558] mb-4">
              Milestones
            </h3>
            <div className="space-y-3">
              {analyticsData.milestoneProgress.map((milestone, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-medium text-[#0B3558]">
                        {formatCurrency(milestone.amount)}
                      </span>
                      {milestone.achieved ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : milestone.isOverdue ? (
                        <AlertTriangle className="w-4 h-4 text-red-600" />
                      ) : (
                        <Clock className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                    <p className="text-sm text-[#476788]">
                      Target: {formatDate(milestone.date)}
                      {milestone.achievedDate && (
                        <span className="ml-2 text-green-600">
                          • Achieved: {formatDate(milestone.achievedDate)}
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-[#0B3558]">
                      {milestone.progress.toFixed(1)}%
                    </p>
                    {!milestone.achieved && (
                      <p className="text-sm text-[#476788]">
                        {milestone.daysUntilMilestone > 0
                          ? `${milestone.daysUntilMilestone} days left`
                          : `${Math.abs(
                              milestone.daysUntilMilestone
                            )} days overdue`}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 mt-6 sm:mt-8">
          {/* Recent Income */}
          {analyticsData.recentIncome.length > 0 && (
            <div className="card p-4 sm:p-6">
              <h3 className="text-lg font-semibold text-[#0B3558] mb-4">
                Recent Income
              </h3>
              <div className="space-y-3">
                {analyticsData.recentIncome.map((income) => (
                  <div
                    key={income._id}
                    className="flex items-center justify-between p-3 bg-green-50 rounded-lg"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-[#0B3558]">
                        {income.source}
                      </p>
                      <p className="text-sm text-[#476788]">
                        {income.category}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-green-600">
                        +{formatCurrency(income.amount)}
                      </p>
                      <p className="text-sm text-[#476788]">
                        {formatDate(income.receivedDate)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Expenses */}
          {analyticsData.recentExpenses.length > 0 && (
            <div className="card p-4 sm:p-6">
              <h3 className="text-lg font-semibold text-[#0B3558] mb-4">
                Recent Expenses
              </h3>
              <div className="space-y-3">
                {analyticsData.recentExpenses.map((expense) => (
                  <div
                    key={expense._id}
                    className="flex items-center justify-between p-3 bg-red-50 rounded-lg"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-[#0B3558]">
                        {expense.name}
                      </p>
                      <p className="text-sm text-[#476788]">
                        {expense.company.name} • {expense.category}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-red-600">
                        -{formatCurrency(expense.amount)}
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
      </div>
    </AppLayout>
  );
}
