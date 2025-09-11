"use client";

import { useState, useEffect } from "react";
import { X, CreditCard, Building2, Wallet, Smartphone } from "lucide-react";

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

interface PaymentMethodModalProps {
  isOpen: boolean;
  onClose: () => void;
  paymentMethod?: PaymentMethod | null;
  onSuccess: (paymentMethod: PaymentMethod) => void;
}

export default function PaymentMethodModal({
  isOpen,
  onClose,
  paymentMethod,
  onSuccess,
}: PaymentMethodModalProps) {
  const [name, setName] = useState("");
  const [type, setType] = useState<PaymentMethod["type"]>("credit_card");
  const [provider, setProvider] = useState("");
  const [lastFourDigits, setLastFourDigits] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [isDefault, setIsDefault] = useState(false);
  const [cardholderName, setCardholderName] = useState("");
  const [bankName, setBankName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (paymentMethod) {
      setName(paymentMethod.name);
      setType(paymentMethod.type);
      setProvider(paymentMethod.provider || "");
      setLastFourDigits(paymentMethod.lastFourDigits || "");
      setExpiryDate(
        paymentMethod.expiryDate ? paymentMethod.expiryDate.split("T")[0] : ""
      );
      setIsDefault(paymentMethod.isDefault);
      setCardholderName(paymentMethod.metadata?.cardholderName || "");
      setBankName(paymentMethod.metadata?.bankName || "");
    } else {
      setName("");
      setType("credit_card");
      setProvider("");
      setLastFourDigits("");
      setExpiryDate("");
      setIsDefault(false);
      setCardholderName("");
      setBankName("");
    }
    setError("");
  }, [paymentMethod]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setError("Payment method name is required");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const url = paymentMethod
        ? `/api/payment-methods/${paymentMethod._id}`
        : "/api/payment-methods";
      const method = paymentMethod ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          type,
          provider: provider.trim() || undefined,
          lastFourDigits: lastFourDigits.trim() || undefined,
          expiryDate: expiryDate || undefined,
          isDefault,
          metadata: {
            cardholderName: cardholderName.trim() || undefined,
            bankName: bankName.trim() || undefined,
          },
        }),
      });

      if (response.ok) {
        const result = await response.json();
        onSuccess(result);
        onClose();
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to save payment method");
      }
    } catch (error) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getTypeIcon = (type: PaymentMethod["type"]) => {
    switch (type) {
      case "credit_card":
      case "debit_card":
        return <CreditCard className="w-5 h-5" />;
      case "bank_account":
        return <Building2 className="w-5 h-5" />;
      case "digital_wallet":
        return <Smartphone className="w-5 h-5" />;
      default:
        return <Wallet className="w-5 h-5" />;
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
      <div className="card max-w-xs w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#E5E7EB]">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-[#006BFF] rounded-lg flex items-center justify-center">
              {getTypeIcon(type)}
            </div>
            <h2 className="text-xl font-semibold text-[#0B3558]">
              {paymentMethod ? "Edit Payment Method" : "Add Payment Method"}
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
              Payment Method Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input-field w-full"
              placeholder="e.g., Chase Visa, PayPal, etc."
              required
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#0B3558] mb-2">
              Type
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as PaymentMethod["type"])}
              className="input-field w-full"
              required
            >
              <option value="credit_card">Credit Card</option>
              <option value="debit_card">Debit Card</option>
              <option value="bank_account">Bank Account</option>
              <option value="digital_wallet">Digital Wallet</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#0B3558] mb-2">
              Provider
            </label>
            <input
              type="text"
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              className="input-field w-full"
              placeholder="e.g., Visa, Mastercard, Chase, PayPal"
            />
          </div>

          {(type === "credit_card" || type === "debit_card") && (
            <>
              <div>
                <label className="block text-sm font-medium text-[#0B3558] mb-2">
                  Last 4 Digits
                </label>
                <input
                  type="text"
                  value={lastFourDigits}
                  onChange={(e) =>
                    setLastFourDigits(
                      e.target.value.replace(/\D/g, "").slice(0, 4)
                    )
                  }
                  className="input-field w-full"
                  placeholder="1234"
                  maxLength={4}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#0B3558] mb-2">
                  Expiry Date
                </label>
                <input
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  className="input-field w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#0B3558] mb-2">
                  Cardholder Name
                </label>
                <input
                  type="text"
                  value={cardholderName}
                  onChange={(e) => setCardholderName(e.target.value)}
                  className="input-field w-full"
                  placeholder="John Doe"
                />
              </div>
            </>
          )}

          {type === "bank_account" && (
            <div>
              <label className="block text-sm font-medium text-[#0B3558] mb-2">
                Bank Name
              </label>
              <input
                type="text"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                className="input-field w-full"
                placeholder="Chase Bank"
              />
            </div>
          )}

          <div className="flex items-center">
            <input
              type="checkbox"
              id="isDefault"
              checked={isDefault}
              onChange={(e) => setIsDefault(e.target.checked)}
              className="h-4 w-4 text-[#006BFF] focus:ring-[#006BFF] border-gray-300 rounded"
            />
            <label
              htmlFor="isDefault"
              className="ml-2 block text-sm text-[#0B3558]"
            >
              Set as default payment method
            </label>
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
              ) : paymentMethod ? (
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
