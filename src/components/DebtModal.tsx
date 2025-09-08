"use client";

import { useState, useEffect } from "react";
import {
  X,
  AlertTriangle,
  Calendar,
  CreditCard,
  Building2,
} from "lucide-react";

interface PaymentMethod {
  _id: string;
  name: string;
  type:
    | "credit_card"
    | "debit_card"
    | "bank_account"
    | "digital_wallet"
    | "other";
  provider?: string;
  lastFourDigits?: string;
  expiryDate?: string;
  isDefault: boolean;
  metadata?: {
    cardholderName?: string;
    bankName?: string;
  };
}

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
  paymentMethod?: PaymentMethod;
  creditor?: string;
  accountNumber?: string;
  isActive: boolean;
  tags: string[];
  notes?: string;
}

interface DebtModalProps {
  isOpen: boolean;
  onClose: () => void;
  debt?: Debt | null;
  paymentMethods: PaymentMethod[];
  onSuccess: (debt: Debt) => void;
}

export default function DebtModal({
  isOpen,
  onClose,
  debt,
  paymentMethods,
  onSuccess,
}: DebtModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [originalAmount, setOriginalAmount] = useState("");
  const [currentBalance, setCurrentBalance] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [type, setType] = useState("credit_card");
  const [interestRate, setInterestRate] = useState("");
  const [minimumPayment, setMinimumPayment] = useState("");
  const [paymentFrequency, setPaymentFrequency] = useState("monthly");
  const [nextPaymentDate, setNextPaymentDate] = useState("");
  const [paymentMethodId, setPaymentMethodId] = useState("");
  const [creditor, setCreditor] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [tags, setTags] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (debt) {
      setName(debt.name);
      setDescription(debt.description || "");
      setOriginalAmount(debt.originalAmount.toString());
      setCurrentBalance(debt.currentBalance.toString());
      setCurrency(debt.currency);
      setType(debt.type);
      setInterestRate(debt.interestRate?.toString() || "");
      setMinimumPayment(debt.minimumPayment.toString());
      setPaymentFrequency(debt.paymentFrequency);
      setNextPaymentDate(
        debt.nextPaymentDate ? debt.nextPaymentDate.split("T")[0] : ""
      );
      setPaymentMethodId(debt.paymentMethod?._id || "");
      setCreditor(debt.creditor || "");
      setAccountNumber(debt.accountNumber || "");
      setTags(debt.tags.join(", "));
      setNotes(debt.notes || "");
    } else {
      setName("");
      setDescription("");
      setOriginalAmount("");
      setCurrentBalance("");
      setCurrency("USD");
      setType("credit_card");
      setInterestRate("");
      setMinimumPayment("");
      setPaymentFrequency("monthly");
      setNextPaymentDate(new Date().toISOString().split("T")[0]);
      setPaymentMethodId("");
      setCreditor("");
      setAccountNumber("");
      setTags("");
      setNotes("");
    }
    setError("");
  }, [debt]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setError("Debt name is required");
      return;
    }

    if (!originalAmount || parseFloat(originalAmount) <= 0) {
      setError("Original amount must be greater than 0");
      return;
    }

    if (!currentBalance || parseFloat(currentBalance) < 0) {
      setError("Current balance cannot be negative");
      return;
    }

    if (!minimumPayment || parseFloat(minimumPayment) <= 0) {
      setError("Minimum payment must be greater than 0");
      return;
    }

    if (!nextPaymentDate) {
      setError("Next payment date is required");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const url = debt ? `/api/debts/${debt._id}` : "/api/debts";
      const method = debt ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || undefined,
          originalAmount: parseFloat(originalAmount),
          currentBalance: parseFloat(currentBalance),
          currency,
          type,
          interestRate: interestRate ? parseFloat(interestRate) : undefined,
          minimumPayment: parseFloat(minimumPayment),
          paymentFrequency,
          nextPaymentDate,
          paymentMethod: paymentMethodId || undefined,
          creditor: creditor.trim() || undefined,
          accountNumber: accountNumber.trim() || undefined,
          tags: tags
            .split(",")
            .map((tag) => tag.trim())
            .filter((tag) => tag),
          notes: notes.trim() || undefined,
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
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="card max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#E5E7EB]">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-orange-600 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-semibold text-[#0B3558]">
              {debt ? "Edit Debt" : "Add Debt"}
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
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
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
              placeholder="e.g., Chase Credit Card, Student Loan"
              required
              autoFocus
            />
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
              placeholder="Optional description of this debt"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-[#0B3558] mb-2">
                Original Amount *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={originalAmount}
                onChange={(e) => setOriginalAmount(e.target.value)}
                className="input-field w-full"
                placeholder="0.00"
                required
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
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-[#0B3558] mb-2">
                Currency
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="input-field w-full"
              >
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
                <option value="CAD">CAD</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#0B3558] mb-2">
                Debt Type
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="input-field w-full"
              >
                <option value="credit_card">Credit Card</option>
                <option value="personal_loan">Personal Loan</option>
                <option value="mortgage">Mortgage</option>
                <option value="student_loan">Student Loan</option>
                <option value="car_loan">Car Loan</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#0B3558] mb-2">
                Interest Rate (%)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={interestRate}
                onChange={(e) => setInterestRate(e.target.value)}
                className="input-field w-full"
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                Payment Frequency
              </label>
              <select
                value={paymentFrequency}
                onChange={(e) => setPaymentFrequency(e.target.value)}
                className="input-field w-full"
              >
                <option value="weekly">Weekly</option>
                <option value="bi-weekly">Bi-weekly</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-[#0B3558] mb-2">
                Payment Method
              </label>
              <select
                value={paymentMethodId}
                onChange={(e) => setPaymentMethodId(e.target.value)}
                className="input-field w-full"
              >
                <option value="">Select payment method</option>
                {paymentMethods.map((method) => (
                  <option key={method._id} value={method._id}>
                    {method.name}{" "}
                    {method.lastFourDigits && `****${method.lastFourDigits}`}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#0B3558] mb-2">
                Creditor
              </label>
              <input
                type="text"
                value={creditor}
                onChange={(e) => setCreditor(e.target.value)}
                className="input-field w-full"
                placeholder="e.g., Chase Bank, Wells Fargo"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#0B3558] mb-2">
              Account Number
            </label>
            <input
              type="text"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              className="input-field w-full"
              placeholder="Last 4 digits or account identifier"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#0B3558] mb-2">
              Tags
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="input-field w-full"
              placeholder="e.g., high-interest, priority, student (comma separated)"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#0B3558] mb-2">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="input-field w-full"
              rows={3}
              placeholder="Additional notes about this debt"
            />
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
              ) : debt ? (
                "Update"
              ) : (
                "Add"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
