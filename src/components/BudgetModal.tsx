"use client";

import { useState, useEffect } from "react";
import { X, DollarSign } from "lucide-react";

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

interface BudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (budget: Budget) => void;
  budget?: Budget;
}

export default function BudgetModal({
  isOpen,
  onClose,
  onSuccess,
  budget,
}: BudgetModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [period, setPeriod] = useState<
    "weekly" | "monthly" | "quarterly" | "yearly"
  >("monthly");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [category, setCategory] = useState("");
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isEditing = !!budget;

  useEffect(() => {
    if (isOpen) {
      fetchCategories();
      if (budget) {
        // Editing mode
        setName(budget.name || "");
        setDescription(budget.description || "");
        setTotalAmount(budget.totalAmount?.toString() || "");
        setPeriod(budget.period || "monthly");
        setStartDate(budget.startDate?.split("T")[0] || "");
        setEndDate(budget.endDate?.split("T")[0] || "");
        setCategory(budget.category || "");
      } else {
        // Create mode
        const today = new Date();
        const nextMonth = new Date(
          today.getFullYear(),
          today.getMonth() + 1,
          today.getDate()
        );

        setName("");
        setDescription("");
        setTotalAmount("");
        setPeriod("monthly");
        setStartDate(today.toISOString().split("T")[0]);
        setEndDate(nextMonth.toISOString().split("T")[0]);
        setCategory("");
      }
      setError("");
    }
  }, [isOpen, budget]);

  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/categories");
      if (response.ok) {
        const data = await response.json();
        const categoryNames = data.map((cat: { name: string }) => cat.name);
        setCategories(categoryNames);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !totalAmount || !startDate || !endDate) {
      setError("Please fill in all required fields");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const budgetData = {
        name: name.trim(),
        description: description.trim(),
        totalAmount: parseFloat(totalAmount),
        period,
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
        category: category.trim(),
        currency: "USD",
        spentAmount: budget?.spentAmount || 0,
        isActive: true,
      };

      const url = isEditing ? `/api/budgets/${budget._id}` : "/api/budgets";
      const method = isEditing ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(budgetData),
      });

      const data = await response.json();

      if (response.ok) {
        onSuccess(data);
        onClose();
      } else {
        setError(data.error || "Failed to save budget");
      }
    } catch (error) {
      console.error("Error saving budget:", error);
      setError("Failed to save budget. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="bg-white rounded-2xl max-w-xs w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#E5E7EB]">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-[#0B3558]">
                {isEditing ? "Edit Budget" : "Create New Budget"}
              </h2>
              <p className="text-sm text-[#476788]">
                {isEditing
                  ? "Update budget details"
                  : "Set up a new spending budget"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[#476788] hover:text-[#0B3558] hover:bg-[#F8F9FB] rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-[#0B3558] mb-2">
                Budget Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input-field w-full"
                placeholder="e.g., Monthly Groceries"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#0B3558] mb-2">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="input-field w-full"
              >
                <option value="">Select a category</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#0B3558] mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input-field w-full"
              rows={3}
              placeholder="Optional description of this budget..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-[#0B3558] mb-2">
                Budget Amount <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={totalAmount}
                onChange={(e) => setTotalAmount(e.target.value)}
                className="input-field w-full"
                placeholder="1000"
                step="0.01"
                min="0"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#0B3558] mb-2">
                Period
              </label>
              <select
                value={period}
                onChange={(e) =>
                  setPeriod(
                    e.target.value as
                      | "weekly"
                      | "monthly"
                      | "quarterly"
                      | "yearly"
                  )
                }
                className="input-field w-full"
              >
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-[#0B3558] mb-2">
                Start Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="input-field w-full"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#0B3558] mb-2">
                End Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="input-field w-full"
                required
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
              disabled={loading}
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading
                ? "Saving..."
                : isEditing
                ? "Update Budget"
                : "Create Budget"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
