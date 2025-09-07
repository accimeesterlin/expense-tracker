"use client";

import { useState, useEffect } from "react";
import { X, DollarSign, Calendar, Building2, CreditCard } from "lucide-react";

interface Company {
  _id: string;
  name: string;
  industry: string;
}

interface PaymentMethod {
  _id: string;
  name: string;
  type: string;
  lastFourDigits?: string;
}

interface Income {
  _id: string;
  source: string;
  description?: string;
  amount: number;
  currency: string;
  frequency: string;
  category: string;
  paymentMethod?: PaymentMethod;
  company?: Company;
  receivedDate: string;
  nextPaymentDate?: string;
  isRecurring: boolean;
  isActive: boolean;
  tags: string[];
  notes?: string;
}

interface IncomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  income?: Income | null;
  companies: Company[];
  paymentMethods: PaymentMethod[];
  onSuccess: (income: Income) => void;
}

export default function IncomeModal({
  isOpen,
  onClose,
  income,
  companies,
  paymentMethods,
  onSuccess,
}: IncomeModalProps) {
  const [source, setSource] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [frequency, setFrequency] = useState("one-time");
  const [category, setCategory] = useState("");
  const [paymentMethodId, setPaymentMethodId] = useState("");
  const [companyId, setCompanyId] = useState("");
  const [receivedDate, setReceivedDate] = useState("");
  const [isRecurring, setIsRecurring] = useState(false);
  const [tags, setTags] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (income) {
      setSource(income.source);
      setDescription(income.description || "");
      setAmount(income.amount.toString());
      setCurrency(income.currency);
      setFrequency(income.frequency);
      setCategory(income.category);
      setPaymentMethodId(income.paymentMethod?._id || "");
      setCompanyId(income.company?._id || "");
      setReceivedDate(
        income.receivedDate ? income.receivedDate.split("T")[0] : ""
      );
      setIsRecurring(income.isRecurring);
      setTags(income.tags.join(", "));
      setNotes(income.notes || "");
    } else {
      setSource("");
      setDescription("");
      setAmount("");
      setCurrency("USD");
      setFrequency("one-time");
      setCategory("");
      setPaymentMethodId("");
      setCompanyId("");
      setReceivedDate(new Date().toISOString().split("T")[0]);
      setIsRecurring(false);
      setTags("");
      setNotes("");
    }
    setError("");
  }, [income]);

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

    if (!category.trim()) {
      setError("Category is required");
      return;
    }

    if (!receivedDate) {
      setError("Received date is required");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const url = income ? `/api/income/${income._id}` : "/api/income";
      const method = income ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          source: source.trim(),
          description: description.trim() || undefined,
          amount: parseFloat(amount),
          currency,
          frequency,
          category: category.trim(),
          paymentMethod: paymentMethodId || undefined,
          company: companyId || undefined,
          receivedDate,
          isRecurring,
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
            <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-semibold text-[#0B3558]">
              {income ? "Edit Income" : "Add Income"}
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-[#0B3558] mb-2">
                Income Source *
              </label>
              <div className="input-field-with-icon">
                <Building2 className="icon w-5 h-5" />
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
              placeholder="Optional description of this income"
            />
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
                Category *
              </label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="input-field w-full"
                placeholder="e.g., Salary, Freelance, Investment"
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
                Company
              </label>
              <select
                value={companyId}
                onChange={(e) => setCompanyId(e.target.value)}
                className="input-field w-full"
              >
                <option value="">Select company</option>
                {companies.map((company) => (
                  <option key={company._id} value={company._id}>
                    {company.name}
                  </option>
                ))}
              </select>
            </div>
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

          <div className="flex items-center">
            <input
              type="checkbox"
              id="isRecurring"
              checked={isRecurring}
              onChange={(e) => setIsRecurring(e.target.checked)}
              className="h-4 w-4 text-green-600 focus:ring-green-600 border-gray-300 rounded"
            />
            <label
              htmlFor="isRecurring"
              className="ml-2 block text-sm text-[#0B3558]"
            >
              This is recurring income
            </label>
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
              placeholder="e.g., bonus, commission, passive (comma separated)"
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
              placeholder="Additional notes about this income"
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
              ) : income ? (
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
