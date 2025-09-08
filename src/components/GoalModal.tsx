"use client";

import { useState, useEffect } from "react";
import { X, Target } from "lucide-react";

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

interface GoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (goal: Goal) => void;
  goal?: Goal;
}

export default function GoalModal({
  isOpen,
  onClose,
  onSuccess,
  goal,
}: GoalModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [currentAmount, setCurrentAmount] = useState("0");
  const [goalType, setGoalType] = useState<
    | "savings"
    | "debt_payoff"
    | "investment"
    | "emergency_fund"
    | "purchase"
    | "other"
  >("savings");
  const [targetDate, setTargetDate] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isEditing = !!goal;

  useEffect(() => {
    if (isOpen) {
      if (goal) {
        // Editing mode
        setName(goal.name || "");
        setDescription(goal.description || "");
        setTargetAmount(goal.targetAmount?.toString() || "");
        setCurrentAmount(goal.currentAmount?.toString() || "0");
        setGoalType(goal.goalType || "savings");
        setTargetDate(goal.targetDate?.split("T")[0] || "");
        setPriority(goal.priority || "medium");
      } else {
        // Create mode
        setName("");
        setDescription("");
        setTargetAmount("");
        setCurrentAmount("0");
        setGoalType("savings");
        setTargetDate("");
        setPriority("medium");
      }
      setError("");
    }
  }, [isOpen, goal]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !targetAmount || !targetDate) {
      setError("Please fill in all required fields");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const goalData = {
        name: name.trim(),
        description: description.trim(),
        targetAmount: parseFloat(targetAmount),
        currentAmount: parseFloat(currentAmount || "0"),
        goalType,
        targetDate: new Date(targetDate).toISOString(),
        priority,
        isActive: true,
      };

      const url = isEditing ? `/api/goals/${goal._id}` : "/api/goals";
      const method = isEditing ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(goalData),
      });

      const data = await response.json();

      if (response.ok) {
        onSuccess(data);
        onClose();
      } else {
        setError(data.error || "Failed to save goal");
      }
    } catch (error) {
      console.error("Error saving goal:", error);
      setError("Failed to save goal. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-3 sm:p-6 border-b border-[#E5E7EB]">
          <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <Target className="w-4 h-4 sm:w-6 sm:h-6 text-green-600" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-lg sm:text-xl font-semibold text-[#0B3558] truncate">
                {isEditing ? "Edit Goal" : "Create New Goal"}
              </h2>
              <p className="text-xs sm:text-sm text-[#476788] truncate">
                {isEditing
                  ? "Update goal details"
                  : "Set up a new financial goal"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 sm:p-2 text-[#476788] hover:text-[#0B3558] hover:bg-[#F8F9FB] rounded-lg transition-colors flex-shrink-0"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-3 sm:p-6 space-y-4 sm:space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-6">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-[#0B3558] mb-1.5 sm:mb-2">
                Goal Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input-field w-full text-sm sm:text-base"
                placeholder="e.g., Emergency Fund"
                required
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-[#0B3558] mb-1.5 sm:mb-2">
                Goal Type
              </label>
              <select
                value={goalType}
                onChange={(e) =>
                  setGoalType(
                    e.target.value as
                      | "savings"
                      | "debt_payoff"
                      | "investment"
                      | "purchase"
                      | "other"
                  )
                }
                className="input-field w-full text-sm sm:text-base"
              >
                <option value="savings">Savings</option>
                <option value="debt_payoff">Debt Payoff</option>
                <option value="investment">Investment</option>
                <option value="emergency_fund">Emergency Fund</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-[#0B3558] mb-1.5 sm:mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input-field w-full text-sm sm:text-base"
              rows={2}
              placeholder="Optional description of this goal..."
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-6">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-[#0B3558] mb-1.5 sm:mb-2">
                Target Amount <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value)}
                className="input-field w-full text-sm sm:text-base"
                placeholder="10000"
                step="0.01"
                min="0"
                required
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-[#0B3558] mb-1.5 sm:mb-2">
                Current Amount
              </label>
              <input
                type="number"
                value={currentAmount}
                onChange={(e) => setCurrentAmount(e.target.value)}
                className="input-field w-full text-sm sm:text-base"
                placeholder="0"
                step="0.01"
                min="0"
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-[#0B3558] mb-1.5 sm:mb-2">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) =>
                  setPriority(e.target.value as "low" | "medium" | "high")
                }
                className="input-field w-full text-sm sm:text-base"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-[#0B3558] mb-1.5 sm:mb-2">
              Target Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="input-field w-full text-sm sm:text-base"
              required
            />
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 pt-2 sm:pt-4">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary w-full sm:w-auto text-sm sm:text-base"
              disabled={loading}
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary w-full sm:w-auto text-sm sm:text-base" disabled={loading}>
              {loading
                ? "Saving..."
                : isEditing
                ? "Update Goal"
                : "Create Goal"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
