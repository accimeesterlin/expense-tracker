"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Plus, DollarSign, Calendar, AlertCircle, Target, TrendingUp, Edit, Trash2 } from "lucide-react";
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
  const { data: session, status } = useSession();
  const router = useRouter();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);

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
      setBudgets(prev => prev.map(b => 
        b._id === editingBudget._id ? budget : b
      ));
    } else {
      setBudgets(prev => [budget, ...prev]);
    }
    setShowModal(false);
    setEditingBudget(null);
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
        setBudgets(prev => prev.filter(b => b._id !== budget._id));
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
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <DollarSign className="w-8 h-8 text-[#006BFF]" />
            <div>
              <h1 className="text-2xl font-semibold text-[#0B3558]">Budgets</h1>
              <p className="text-sm text-[#476788]">Track and manage your spending budgets</p>
            </div>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="btn-primary inline-flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Create Budget</span>
          </button>
        </div>


        {/* Budgets List */}
        {budgets.length === 0 ? (
          <div className="card p-12 text-center">
            <DollarSign className="w-16 h-16 text-[#A6BBD1] mx-auto mb-8" />
            <h3 className="text-lg font-medium text-[#0B3558] mb-2">No budgets yet</h3>
            <p className="text-[#476788] mb-6">Create your first budget to start tracking your spending</p>
            <button
              onClick={() => setShowModal(true)}
              className="btn-primary inline-flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Create Your First Budget</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {budgets.map((budget) => (
              <div key={budget._id} className="card p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-semibold text-[#0B3558]">{budget.name}</h3>
                    {budget.category && (
                      <p className="text-sm text-[#476788]">{budget.category}</p>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleEdit(budget)}
                      className="p-1 text-[#476788] hover:text-[#0B3558] rounded"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(budget)}
                      className="p-1 text-[#476788] hover:text-red-600 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-[#476788]">Spent</span>
                    <span className="font-medium text-[#0B3558]">
                      {formatCurrency(budget.spentAmount)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-[#476788]">Budget</span>
                    <span className="font-medium text-[#0B3558]">
                      {formatCurrency(budget.totalAmount)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-[#476788]">Remaining</span>
                    <span className={`font-medium ${budget.remainingAmount <= 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {formatCurrency(budget.remainingAmount)}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-[#476788]">Progress</span>
                      <span className={`text-xs font-medium ${
                        budget.percentageUsed >= 100 ? 'text-red-600' : 
                        budget.percentageUsed >= budget.alertThreshold ? 'text-yellow-600' : 'text-green-600'
                      }`}>
                        {Math.round(budget.percentageUsed)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(budget.percentageUsed, budget.alertThreshold)}`}
                        style={{ width: `${Math.min(100, budget.percentageUsed)}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[#E5E7EB]">
                    <div className="flex justify-between items-center text-xs text-[#476788]">
                      <span>{budget.period.charAt(0).toUpperCase() + budget.period.slice(1)}</span>
                      <span>{budget.daysRemaining} days left</span>
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
          setEditingBudget(null);
        }}
        onSuccess={handleBudgetSuccess}
        budget={editingBudget}
      />
    </AppLayout>
  );
}