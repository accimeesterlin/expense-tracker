"use client";

import { useState, useEffect } from "react";
import { DollarSign, Calendar, X } from "lucide-react";
import { Modal, ModalHeader, ModalContent, ModalFooter, ModalTitle, ModalDescription } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { FormField, FormLabel, FormInput, FormSelect, FormError } from "@/components/ui/Form";

interface Income {
  _id: string;
  source: string;
  description?: string;
  amount: number;
  currency: string;
  frequency: string;
  category: string;
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
  company?: {
    _id: string;
    name: string;
    industry: string;
    description?: string;
    address: {
      street?: string;
      city: string;
      state: string;
      zipCode?: string;
    };
    contactInfo: {
      email: string;
      phone?: string;
      website?: string;
    };
    createdAt: string;
  };
  receivedDate: string;
  nextPaymentDate?: string;
  isRecurring: boolean;
  isActive: boolean;
  tags: string[];
  notes?: string;
  createdAt: string;
}

interface SimpleIncomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (income: Income) => void;
  income?: Income;
}

export default function SimpleIncomeModal({
  isOpen,
  onClose,
  onSuccess,
  income,
}: SimpleIncomeModalProps) {
  const [source, setSource] = useState("");
  const [amount, setAmount] = useState("");
  const [frequency, setFrequency] = useState("monthly");
  const [receivedDate, setReceivedDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isEditing = !!income;

  useEffect(() => {
    if (isOpen) {
      if (income) {
        // Editing mode
        setSource(income.source || "");
        setAmount(income.amount?.toString() || "");
        setFrequency(income.frequency || "monthly");
        setReceivedDate(
          income.nextPaymentDate?.split("T")[0] ||
            new Date().toISOString().split("T")[0]
        );
      } else {
        // Create mode
        setSource("");
        setAmount("");
        setFrequency("monthly");
        setReceivedDate(new Date().toISOString().split("T")[0]);
      }
      setError("");
    }
  }, [isOpen, income]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!source.trim()) {
      setError("Income source is required");
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      setError("Amount must be greater than 0");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const url = isEditing ? `/api/income/${income._id}` : "/api/income";
      const method = isEditing ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          source: source.trim(),
          amount: parseFloat(amount),
          currency: "USD",
          frequency,
          category: "Income",
          receivedDate,
          isRecurring: frequency !== "one-time",
        }),
      });

      if (response.ok) {
        const result = await response.json();
        onSuccess(result);
        onClose();
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to save income");
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
      <div className="card max-w-sm w-full mx-2 sm:mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#E5E7EB]">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-semibold text-[#0B3558]">
              {isEditing ? "Edit Income" : "Add Income"}
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
              Income Source *
            </label>
            <input
              type="text"
              value={source}
              onChange={(e) => setSource(e.target.value)}
              className="input-field w-full"
              placeholder="e.g., Salary, Freelance, Investment"
              required
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#0B3558] mb-2">
              Amount *
            </label>
            <div className="input-field-with-icon">
              <DollarSign className="icon w-5 h-5" />
              <input
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="input-field w-full"
                placeholder="0.00"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#0B3558] mb-2">
              Frequency
            </label>
            <select
              value={frequency}
              onChange={(e) => setFrequency(e.target.value)}
              className="input-field w-full"
            >
              <option value="one-time">One-time</option>
              <option value="weekly">Weekly</option>
              <option value="bi-weekly">Bi-weekly</option>
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#0B3558] mb-2">
              Received Date *
            </label>
            <div className="input-field-with-icon">
              <Calendar className="icon w-5 h-5" />
              <input
                type="date"
                value={receivedDate}
                onChange={(e) => setReceivedDate(e.target.value)}
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
                "Update Income"
              ) : (
                "Add Income"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
