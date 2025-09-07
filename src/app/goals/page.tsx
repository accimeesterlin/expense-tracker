"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Plus, Target, Calendar, TrendingUp, CheckCircle, Circle, Flag, Edit, Trash2 } from "lucide-react";
import AppLayout from "@/components/AppLayout";
import GoalModal from "@/components/GoalModal";

interface Goal {
  _id: string;
  name: string;
  description?: string;
  targetAmount: number;
  currentAmount: number;
  currency: string;
  goalType: "savings" | "debt_payoff" | "investment" | "emergency_fund" | "other";
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
  const { data: session, status } = useSession();
  const router = useRouter();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated") {
      router.push("/auth/signin");
      return;
    }
    fetchGoals();
  }, [status, router]);

  const fetchGoals = async () => {
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
  };

  const handleGoalSuccess = (goal: Goal) => {
    if (editingGoal) {
      // Update existing goal
      setGoals(prev => prev.map(g => 
        g._id === editingGoal._id ? goal : g
      ));
    } else {
      // Add new goal to beginning of list
      setGoals(prev => [goal, ...prev]);
    }
    
    // Close modal and reset editing goal
    setShowModal(false);
    setEditingGoal(null);
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
        setGoals(prev => prev.filter(g => g._id !== goal._id));
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
      case "high": return "text-red-600 bg-red-100";
      case "medium": return "text-yellow-600 bg-yellow-100";
      case "low": return "text-green-600 bg-green-100";
      default: return "text-gray-600 bg-gray-100";
    }
  };

  const getGoalTypeIcon = (type: string) => {
    switch (type) {
      case "savings": return "💰";
      case "debt_payoff": return "💳";
      case "investment": return "📈";
      case "emergency_fund": return "🚨";
      default: return "🎯";
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
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <Target className="w-8 h-8 text-[#006BFF]" />
            <div>
              <h1 className="text-2xl font-semibold text-[#0B3558]">Financial Goals</h1>
              <p className="text-sm text-[#476788]">Set and track your financial objectives</p>
            </div>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="btn-primary inline-flex items-center space-x-2"
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
            setEditingGoal(null);
          }}
          onSuccess={handleGoalSuccess}
          goal={editingGoal}
        />

        {/* Goals List */}
        {goals.length === 0 ? (
          <div className="card p-12 text-center">
            <Target className="w-16 h-16 text-[#A6BBD1] mx-auto mb-8" />
            <h3 className="text-lg font-medium text-[#0B3558] mb-2">No goals yet</h3>
            <p className="text-[#476788] mb-6">Set your first financial goal to start tracking your progress</p>
            <button
              onClick={() => setShowModal(true)}
              className="btn-primary inline-flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Create Your First Goal</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {goals.map((goal) => (
              <div key={goal._id} className="card p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{getGoalTypeIcon(goal.goalType)}</span>
                    <div>
                      <h3 className="font-semibold text-[#0B3558]">{goal.name}</h3>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(goal.priority)}`}>
                          {goal.priority}
                        </span>
                        {goal.isCompleted && (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleEdit(goal)}
                      className="p-1 text-[#476788] hover:text-[#0B3558] rounded"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(goal)}
                      className="p-1 text-[#476788] hover:text-red-600 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-[#476788]">Current</span>
                    <span className="font-medium text-[#0B3558]">
                      {formatCurrency(goal.currentAmount)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-[#476788]">Target</span>
                    <span className="font-medium text-[#0B3558]">
                      {formatCurrency(goal.targetAmount)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-[#476788]">Remaining</span>
                    <span className={`font-medium ${goal.remainingAmount <= 0 ? 'text-green-600' : 'text-[#0B3558]'}`}>
                      {formatCurrency(goal.remainingAmount)}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-[#476788]">Progress</span>
                      <span className={`text-xs font-medium ${
                        goal.percentageCompleted >= 100 ? 'text-green-600' : 'text-[#006BFF]'
                      }`}>
                        {Math.round(goal.percentageCompleted)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${
                          goal.percentageCompleted >= 100 ? 'bg-green-500' : 'bg-[#006BFF]'
                        }`}
                        style={{ width: `${Math.min(100, goal.percentageCompleted)}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[#E5E7EB] space-y-2">
                    <div className="flex justify-between items-center text-xs text-[#476788]">
                      <span className="flex items-center space-x-1">
                        <Calendar className="w-3 h-3" />
                        <span>{goal.daysRemaining} days left</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <TrendingUp className="w-3 h-3" />
                        <span>{formatCurrency(goal.requiredMonthlySavings)}/month</span>
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