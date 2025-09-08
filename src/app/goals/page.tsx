"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Target,
  Calendar,
  TrendingUp,
  CheckCircle,
  Edit,
  Trash2,
} from "lucide-react";
import AppLayout from "@/components/AppLayout";
import GoalModal from "@/components/GoalModal";

interface Goal {
  _id: string;
  name: string;
  description?: string;
  targetAmount: number;
  currentAmount: number;
  currency: string;
  goalType:
    | "savings"
    | "debt_payoff"
    | "investment"
    | "emergency_fund"
    | "purchase"
    | "other";
  targetDate: string;
  priority: "low" | "medium" | "high";
  isCompleted: boolean;
  isActive: boolean;
  remainingAmount: number;
  percentageCompleted: number;
  daysRemaining: number;
  requiredMonthlySavings: number;
  milestones: {
    amount: number;
    date: string;
    achieved: boolean;
    achievedDate?: string;
  }[];
}

export default function GoalsPage() {
  const { status } = useSession();
  const router = useRouter();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | undefined>(undefined);

  const fetchGoals = useCallback(async () => {
    try {
      const response = await fetch("/api/goals");
      if (response.ok) {
        const data = await response.json();
        setGoals(Array.isArray(data) ? data : []);
      } else {
        console.error("Failed to fetch goals:", response.statusText);
        setGoals([]);
      }
    } catch (error) {
      console.error("Error fetching goals:", error);
      setGoals([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated") {
      router.push("/auth/signin");
      return;
    }
    fetchGoals();
  }, [status, router, fetchGoals]);

  const handleGoalSuccess = (goal: Goal) => {
    if (editingGoal) {
      // Update existing goal
      setGoals((prev) =>
        prev.map((g) => (g._id === editingGoal._id ? goal : g))
      );
    } else {
      // Add new goal to beginning of list
      setGoals((prev) => [goal, ...prev]);
    }

    // Close modal and reset editing goal
    setShowModal(false);
    setEditingGoal(undefined);
  };

  const handleEdit = (goal: Goal) => {
    setEditingGoal(goal);
    setShowModal(true);
  };

  const handleDelete = async (goal: Goal) => {
    if (!confirm(`Are you sure you want to delete "${goal.name}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/goals/${goal._id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setGoals((prev) => prev.filter((g) => g._id !== goal._id));
      } else {
        const errorData = await response.json();
        alert(errorData.error || "Failed to delete goal");
      }
    } catch (error) {
      alert("Something went wrong. Please try again.");
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "text-red-600 bg-red-100";
      case "medium":
        return "text-yellow-600 bg-yellow-100";
      case "low":
        return "text-green-600 bg-green-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getGoalTypeIcon = (type: string) => {
    switch (type) {
      case "savings":
        return "💰";
      case "debt_payoff":
        return "💳";
      case "investment":
        return "📈";
      case "emergency_fund":
        return "🚨";
      default:
        return "🎯";
    }
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

  return (
    <AppLayout title="Goals">
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <Target className="w-6 h-6 sm:w-8 sm:h-8 text-[#006BFF]" />
            <div>
              <h1 className="text-xl sm:text-2xl font-semibold text-[#0B3558]">
                Financial Goals
              </h1>
              <p className="text-xs sm:text-sm text-[#476788]">
                Set and track your financial objectives
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="btn-primary inline-flex items-center space-x-2 text-sm sm:text-base w-full sm:w-auto justify-center"
          >
            <Plus className="w-4 h-4" />
            <span>Create Goal</span>
          </button>
        </div>

        {/* Goal Modal */}
        <GoalModal
          isOpen={showModal}
          onClose={() => {
            setShowModal(false);
            setEditingGoal(undefined);
          }}
          onSuccess={handleGoalSuccess}
          goal={editingGoal}
        />

        {/* Goals List */}
        {goals.length === 0 ? (
          <div className="card p-8 sm:p-12 text-center">
            <Target className="w-12 h-12 sm:w-16 sm:h-16 text-[#A6BBD1] mx-auto mb-4 sm:mb-8" />
            <h3 className="text-base sm:text-lg font-medium text-[#0B3558] mb-2">
              No goals yet
            </h3>
            <p className="text-sm sm:text-base text-[#476788] mb-4 sm:mb-6">
              Set your first financial goal to start tracking your progress
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="btn-primary inline-flex items-center space-x-2 text-sm sm:text-base"
            >
              <Plus className="w-4 h-4" />
              <span>Create Your First Goal</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {goals.map((goal) => (
              <div key={goal._id} className="card p-4 sm:p-6">
                <div className="flex justify-between items-start mb-3 sm:mb-4">
                  <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
                    <span className="text-xl sm:text-2xl flex-shrink-0">
                      {getGoalTypeIcon(goal.goalType)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-[#0B3558] text-sm sm:text-base truncate">
                        {goal.name}
                      </h3>
                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-1">
                        <span
                          className={`px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full text-xs font-medium ${getPriorityColor(
                            goal.priority
                          )}`}
                        >
                          {goal.priority}
                        </span>
                        {goal.isCompleted && (
                          <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-600" />
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1 sm:space-x-2 ml-2">
                    <button
                      onClick={() => handleEdit(goal)}
                      className="p-1 text-[#476788] hover:text-[#0B3558] rounded"
                    >
                      <Edit className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(goal)}
                      className="p-1 text-[#476788] hover:text-red-600 rounded"
                    >
                      <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2 sm:space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs sm:text-sm text-[#476788]">Current</span>
                    <span className="font-medium text-[#0B3558] text-xs sm:text-sm truncate ml-2" title={formatCurrency(goal.currentAmount)}>
                      {formatCurrency(goal.currentAmount)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs sm:text-sm text-[#476788]">Target</span>
                    <span className="font-medium text-[#0B3558] text-xs sm:text-sm truncate ml-2" title={formatCurrency(goal.targetAmount)}>
                      {formatCurrency(goal.targetAmount)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs sm:text-sm text-[#476788]">Remaining</span>
                    <span
                      className={`font-medium text-xs sm:text-sm truncate ml-2 ${
                        goal.remainingAmount <= 0
                          ? "text-green-600"
                          : "text-[#0B3558]"
                      }`}
                      title={formatCurrency(goal.remainingAmount)}
                    >
                      {formatCurrency(goal.remainingAmount)}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1.5 sm:space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-[#476788]">Progress</span>
                      <span
                        className={`text-xs font-medium ${
                          goal.percentageCompleted >= 100
                            ? "text-green-600"
                            : "text-[#006BFF]"
                        }`}
                      >
                        {Math.round(goal.percentageCompleted)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5 sm:h-2">
                      <div
                        className={`h-1.5 sm:h-2 rounded-full transition-all duration-300 ${
                          goal.percentageCompleted >= 100
                            ? "bg-green-500"
                            : "bg-[#006BFF]"
                        }`}
                        style={{
                          width: `${Math.min(100, goal.percentageCompleted)}%`,
                        }}
                      ></div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[#E5E7EB] space-y-1.5 sm:space-y-2">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-0 text-xs text-[#476788]">
                      <span className="flex items-center space-x-1">
                        <Calendar className="w-3 h-3 flex-shrink-0" />
                        <span>{goal.daysRemaining} days left</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <TrendingUp className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate" title={`${formatCurrency(goal.requiredMonthlySavings)}/month`}>
                          {formatCurrency(goal.requiredMonthlySavings)}/month
                        </span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
