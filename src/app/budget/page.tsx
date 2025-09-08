"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Plus, DollarSign, Edit, Trash2 } from "lucide-react";
import AppLayout from "@/components/AppLayout";
import BudgetModal from "@/components/BudgetModal";

interface Budget {
  _id: string;
  name: string;
  description?: string;
  totalAmount: number;
  spentAmount: number;
  currency: string;
  category?: string;
  period: "weekly" | "monthly" | "quarterly" | "yearly";
  startDate: string;
  endDate: string;
  isActive: boolean;
  alertThreshold: number;
  remainingAmount: number;
  percentageUsed: number;
  daysRemaining: number;
}

export default function BudgetPage() {
  const { status } = useSession();
  const router = useRouter();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | undefined>(
    undefined
  );

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated") {
      router.push("/auth/signin");
      return;
    }
    fetchBudgets();
  }, [status, router]);

  const fetchBudgets = async () => {
    try {
      const response = await fetch("/api/budgets");
      if (response.ok) {
        const data = await response.json();
        setBudgets(Array.isArray(data) ? data : []);
      } else {
        console.error("Failed to fetch budgets:", response.statusText);
        setBudgets([]);
      }
    } catch (error) {
      console.error("Error fetching budgets:", error);
      setBudgets([]);
    } finally {
      setLoading(false);
    }
  };

  const handleBudgetSuccess = (budget: Budget) => {
    if (editingBudget) {
      setBudgets((prev) =>
        prev.map((b) => (b._id === editingBudget._id ? budget : b))
      );
    } else {
      setBudgets((prev) => [budget, ...prev]);
    }
    setShowModal(false);
    setEditingBudget(undefined);
  };

  const handleEdit = (budget: Budget) => {
    setEditingBudget(budget);
    setShowModal(true);
  };

  const handleDelete = async (budget: Budget) => {
    if (!confirm(`Are you sure you want to delete "${budget.name}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/budgets/${budget._id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setBudgets((prev) => prev.filter((b) => b._id !== budget._id));
      } else {
        const errorData = await response.json();
        alert(errorData.error || "Failed to delete budget");
      }
    } catch (error) {
      alert("Something went wrong. Please try again.");
    }
  };

  const formatCurrency = (amount: number) => {
    if (amount == null || isNaN(amount)) {
      return "$0.00";
    }
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const getProgressColor = (percentage: number, threshold: number) => {
    if (percentage >= 100) return "bg-red-500";
    if (percentage >= threshold) return "bg-yellow-500";
    return "bg-green-500";
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
    <AppLayout title="Budgets">
      <div className="space-y-3 sm:space-y-4 lg:space-y-6 w-full overflow-x-hidden">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-3 lg:gap-0">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-[#006BFF] flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <h1 className="text-lg sm:text-xl lg:text-2xl font-semibold text-[#0B3558] truncate">
                Budgets
              </h1>
              <p className="text-xs sm:text-sm text-[#476788] truncate">
                Track and manage your spending budgets
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="btn-primary inline-flex items-center space-x-2 text-sm sm:text-base w-full sm:w-auto justify-center"
          >
            <Plus className="w-4 h-4" />
            <span>Create Budget</span>
          </button>
        </div>

        {/* Budgets List */}
        {budgets.length === 0 ? (
          <div className="card p-6 sm:p-8 lg:p-12 text-center">
            <DollarSign className="w-10 h-10 sm:w-12 sm:h-12 lg:w-16 lg:h-16 text-[#A6BBD1] mx-auto mb-3 sm:mb-4 lg:mb-8" />
            <h3 className="text-sm sm:text-base lg:text-lg font-medium text-[#0B3558] mb-2">
              No budgets yet
            </h3>
            <p className="text-xs sm:text-sm lg:text-base text-[#476788] mb-3 sm:mb-4 lg:mb-6">
              Create your first budget to start tracking your spending
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="btn-primary inline-flex items-center space-x-2 text-xs sm:text-sm lg:text-base"
            >
              <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
              <span>Create Your First Budget</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6 w-full">
            {budgets.map((budget) => (
              <div
                key={budget._id}
                className="card p-3 sm:p-4 lg:p-6 w-full overflow-hidden"
              >
                <div className="flex justify-between items-start mb-2 sm:mb-3 lg:mb-4">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-[#0B3558] text-xs sm:text-sm lg:text-base truncate">
                      {budget.name}
                    </h3>
                    {budget.category && (
                      <p className="text-xs sm:text-sm text-[#476788] truncate">
                        {budget.category}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center space-x-1 sm:space-x-2 ml-2">
                    <button
                      onClick={() => handleEdit(budget)}
                      className="p-1 text-[#476788] hover:text-[#0B3558] rounded"
                    >
                      <Edit className="w-3 h-3 sm:w-3.5 sm:h-3.5 lg:w-4 lg:h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(budget)}
                      className="p-1 text-[#476788] hover:text-red-600 rounded"
                    >
                      <Trash2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 lg:w-4 lg:h-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5 sm:space-y-2 lg:space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs sm:text-sm text-[#476788]">
                      Spent
                    </span>
                    <span
                      className="font-medium text-[#0B3558] text-xs sm:text-sm truncate ml-2"
                      title={formatCurrency(budget.spentAmount)}
                    >
                      {formatCurrency(budget.spentAmount)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs sm:text-sm text-[#476788]">
                      Budget
                    </span>
                    <span
                      className="font-medium text-[#0B3558] text-xs sm:text-sm truncate ml-2"
                      title={formatCurrency(budget.totalAmount)}
                    >
                      {formatCurrency(budget.totalAmount)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs sm:text-sm text-[#476788]">
                      Remaining
                    </span>
                    <span
                      className={`font-medium text-xs sm:text-sm truncate ml-2 ${
                        budget.remainingAmount <= 0
                          ? "text-red-600"
                          : "text-green-600"
                      }`}
                      title={formatCurrency(budget.remainingAmount)}
                    >
                      {formatCurrency(budget.remainingAmount)}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1 sm:space-y-1.5 lg:space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-[#476788]">Progress</span>
                      <span
                        className={`text-xs font-medium ${
                          budget.percentageUsed >= 100
                            ? "text-red-600"
                            : budget.percentageUsed >= budget.alertThreshold
                            ? "text-yellow-600"
                            : "text-green-600"
                        }`}
                      >
                        {Math.round(budget.percentageUsed || 0)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1 sm:h-1.5 lg:h-2">
                      <div
                        className={`h-1 sm:h-1.5 lg:h-2 rounded-full transition-all duration-300 ${getProgressColor(
                          budget.percentageUsed || 0,
                          budget.alertThreshold
                        )}`}
                        style={{
                          width: `${Math.min(
                            100,
                            budget.percentageUsed || 0
                          )}%`,
                        }}
                      ></div>
                    </div>
                  </div>

                  <div className="pt-1.5 sm:pt-2 border-t border-[#E5E7EB]">
                    <div className="flex justify-between items-center text-xs text-[#476788]">
                      <span className="truncate">
                        {budget.period.charAt(0).toUpperCase() +
                          budget.period.slice(1)}
                      </span>
                      <span className="whitespace-nowrap ml-2">
                        {budget.daysRemaining} days left
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <BudgetModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingBudget(undefined);
        }}
        onSuccess={handleBudgetSuccess}
        budget={editingBudget}
      />
    </AppLayout>
  );
}
