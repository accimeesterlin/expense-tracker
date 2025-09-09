"use client";

import { useState, useEffect } from "react";
import { X, AlertTriangle, Calendar } from "lucide-react";

interface Debt {
  _id: string;
  name: string;
  description?: string;
  originalAmount: number;
  currentBalance: number;
  currency: string;
  type: string;
  interestRate?: number;
  minimumPayment: number;
  paymentFrequency: string;
  nextPaymentDate: string;
  paymentMethod?: {
    _id: string;
    name: string;
    type:
      | "credit_card"
      | "debit_card"
      | "bank_account"
      | "digital_wallet"
      | "other";
    lastFourDigits?: string;
    isDefault: boolean;
  };
  creditor?: string;
  accountNumber?: string;
  isActive: boolean;
  tags: string[];
  notes?: string;
  createdAt: string;
}

interface SimpleDebtModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (debt: Debt) => void;
  debt?: Debt;
}

export default function SimpleDebtModal({
  isOpen,
  onClose,
  onSuccess,
  debt,
}: SimpleDebtModalProps) {
  const [name, setName] = useState("");
  const [currentBalance, setCurrentBalance] = useState("");
  const [minimumPayment, setMinimumPayment] = useState("");
  const [nextPaymentDate, setNextPaymentDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isEditing = !!debt;

  useEffect(() => {
    if (isOpen) {
      if (debt) {
        // Editing mode
        setName(debt.name || "");
        setCurrentBalance(debt.currentBalance?.toString() || "");
        setMinimumPayment(debt.minimumPayment?.toString() || "");
        setNextPaymentDate(
          debt.nextPaymentDate?.split("T")[0] ||
            new Date().toISOString().split("T")[0]
        );
      } else {
        // Create mode
        setName("");
        setCurrentBalance("");
        setMinimumPayment("");
        setNextPaymentDate(new Date().toISOString().split("T")[0]);
      }
      setError("");
    }
  }, [isOpen, debt]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setError("Debt name is required");
      return;
    }

    if (!currentBalance || parseFloat(currentBalance) <= 0) {
      setError("Current balance must be greater than 0");
      return;
    }

    if (!minimumPayment || parseFloat(minimumPayment) <= 0) {
      setError("Minimum payment must be greater than 0");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const url = isEditing ? `/api/debts/${debt._id}` : "/api/debts";
      const method = isEditing ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          originalAmount: parseFloat(currentBalance), // For simplicity, assume original = current
          currentBalance: parseFloat(currentBalance),
          currency: "USD",
          type: "other",
          minimumPayment: parseFloat(minimumPayment),
          paymentFrequency: "monthly",
          nextPaymentDate,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        onSuccess(result);
        onClose();
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to save debt");
      }
    } catch (error) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="card max-w-2xl w-full mx-2 sm:mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#E5E7EB]">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-orange-600 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-semibold text-[#0B3558]">
              {isEditing ? "Edit Debt" : "Add Debt"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-[#A6BBD1] hover:text-[#0B3558] transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-[#0B3558] mb-2">
              Debt Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input-field w-full"
              placeholder="e.g., Credit Card, Student Loan"
              required
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#0B3558] mb-2">
              Current Balance *
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={currentBalance}
              onChange={(e) => setCurrentBalance(e.target.value)}
              className="input-field w-full"
              placeholder="0.00"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#0B3558] mb-2">
              Minimum Payment *
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={minimumPayment}
              onChange={(e) => setMinimumPayment(e.target.value)}
              className="input-field w-full"
              placeholder="0.00"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#0B3558] mb-2">
              Next Payment Date *
            </label>
            <div className="input-field-with-icon">
              <Calendar className="icon w-5 h-5" />
              <input
                type="date"
                value={nextPaymentDate}
                onChange={(e) => setNextPaymentDate(e.target.value)}
                className="input-field w-full"
                required
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 btn-secondary"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 btn-primary"
              disabled={loading}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" />
              ) : isEditing ? (
                "Update Debt"
              ) : (
                "Add Debt"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
