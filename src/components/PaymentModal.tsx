"use client";

import { useState, useEffect } from "react";
import { X, DollarSign, FileText, Upload } from "lucide-react";
import Image from "next/image";

interface Company {
  _id: string;
  name: string;
  industry: string;
}

interface PaymentMethod {
  _id: string;
  name: string;
  type: string;
}

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: "debt_payment" | "income_received";
  referenceId: string;
  referenceName: string;
  company?: Company;
  suggestedAmount?: number;
  onSuccess: () => void;
}

export default function PaymentModal({
  isOpen,
  onClose,
  type,
  referenceId,
  referenceName,
  company,
  suggestedAmount,
  onSuccess,
}: PaymentModalProps) {
  const [formData, setFormData] = useState({
    amount: suggestedAmount?.toString() || "",
    paymentDate: new Date().toISOString().split("T")[0],
    paymentMethod: "",
    category: type === "debt_payment" ? "Debt Payment" : "Income",
    description: "",
    tags: "",
    notes: "",
    receipt: null as File | null,
  });

  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      fetchPaymentMethods();
      setFormData(prev => ({
        ...prev,
        amount: suggestedAmount?.toString() || "",
        description: type === "debt_payment" 
          ? `Payment for ${referenceName}`
          : `Income from ${referenceName}`,
      }));
    }
  }, [isOpen, suggestedAmount, referenceName, type]);

  const fetchPaymentMethods = async () => {
    try {
      const response = await fetch("/api/payment-methods");
      if (response.ok) {
        const data = await response.json();
        setPaymentMethods(data);
      }
    } catch (error) {
      console.error("Error fetching payment methods:", error);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({ ...prev, receipt: file }));
      
      // Create preview for images
      if (file.type.startsWith("image/")) {
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
      } else {
        setPreviewUrl(null);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      let receiptUrl = "";
      let receiptS3Key = "";
      let receiptFileName = "";
      let receiptContentType = "";

      // Upload receipt if provided
      if (formData.receipt) {
        const receiptFormData = new FormData();
        receiptFormData.append("file", formData.receipt);
        receiptFormData.append("type", "receipt");

        const uploadResponse = await fetch("/api/upload", {
          method: "POST",
          body: receiptFormData,
        });

        if (uploadResponse.ok) {
          const uploadData = await uploadResponse.json();
          receiptUrl = uploadData.url;
          receiptS3Key = uploadData.key;
          receiptFileName = formData.receipt.name;
          receiptContentType = formData.receipt.type;
        }
      }

      // Create payment
      const paymentData = {
        type,
        referenceId,
        amount: parseFloat(formData.amount),
        paymentDate: formData.paymentDate,
        paymentMethod: formData.paymentMethod || undefined,
        company: company?._id,
        category: formData.category,
        description: formData.description,
        tags: formData.tags ? formData.tags.split(",").map(tag => tag.trim()) : [],
        notes: formData.notes,
        receiptUrl,
        receiptS3Key,
        receiptFileName,
        receiptContentType,
      };

      const response = await fetch("/api/payments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(paymentData),
      });

      if (response.ok) {
        onSuccess();
        resetForm();
        onClose();
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to record payment");
      }
    } catch (error) {
      console.error("Error recording payment:", error);
      setError("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      amount: "",
      paymentDate: new Date().toISOString().split("T")[0],
      paymentMethod: "",
      category: type === "debt_payment" ? "Debt Payment" : "Income",
      description: "",
      tags: "",
      notes: "",
      receipt: null,
    });
    setPreviewUrl(null);
    setError("");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <DollarSign className="w-6 h-6 text-[#006BFF]" />
            <h2 className="text-xl font-semibold text-[#0B3558]">
              {type === "debt_payment" ? "Record Debt Payment" : "Record Income"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#0B3558] mb-2">
                {type === "debt_payment" ? "Payment For" : "Income From"}
              </label>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="font-medium text-[#0B3558]">{referenceName}</p>
                {company && (
                  <p className="text-sm text-[#476788]">{company.name}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#0B3558] mb-2">
                Amount *
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#476788]" />
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={formData.amount}
                  onChange={(e) =>
                    setFormData(prev => ({ ...prev, amount: e.target.value }))
                  }
                  className="input-field pl-12"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#0B3558] mb-2">
                Date *
              </label>
              <input
                type="date"
                required
                value={formData.paymentDate}
                onChange={(e) =>
                  setFormData(prev => ({ ...prev, paymentDate: e.target.value }))
                }
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#0B3558] mb-2">
                Payment Method
              </label>
              <select
                value={formData.paymentMethod}
                onChange={(e) =>
                  setFormData(prev => ({ ...prev, paymentMethod: e.target.value }))
                }
                className="input-field"
              >
                <option value="">Select payment method</option>
                {paymentMethods.map((method) => (
                  <option key={method._id} value={method._id}>
                    {method.name} ({method.type})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#0B3558] mb-2">
                Description
              </label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) =>
                  setFormData(prev => ({ ...prev, description: e.target.value }))
                }
                className="input-field"
                placeholder="Payment description"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#0B3558] mb-2">
                Receipt
              </label>
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={handleFileChange}
                className="input-field"
              />
              {previewUrl && (
                <div className="mt-2">
                  <Image
                    src={previewUrl}
                    alt="Receipt preview"
                    width={200}
                    height={150}
                    className="rounded border object-cover"
                  />
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-[#0B3558] mb-2">
                Tags
              </label>
              <input
                type="text"
                value={formData.tags}
                onChange={(e) =>
                  setFormData(prev => ({ ...prev, tags: e.target.value }))
                }
                className="input-field"
                placeholder="Tag1, Tag2, Tag3"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#0B3558] mb-2">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) =>
                  setFormData(prev => ({ ...prev, notes: e.target.value }))
                }
                className="input-field"
                rows={3}
                placeholder="Additional notes"
              />
            </div>

            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary flex-1"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary flex-1"
                disabled={isSubmitting || !formData.amount}
              >
                {isSubmitting ? "Recording..." : "Record Payment"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}