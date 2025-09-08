"use client";

import { useState, useEffect } from "react";
import { X, CreditCard, FileText, Camera } from "lucide-react";
import NextImage from "next/image";

interface Company {
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
}

interface Expense {
  _id: string;
  name: string;
  description?: string;
  amount: number;
  company: Company;
  category: string;
  tags?: string[];
  expenseType: string;
  frequency?: string;
  startDate?: string;
  nextBillingDate?: string;
  isActive: boolean;
  receiptUrl?: string;
  receiptS3Key?: string;
  receiptFileName?: string;
  receiptContentType?: string;
  comments: Array<{
    text: string;
    createdAt: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  companies: Company[];
  expense?: Expense;
  onSuccess: (expense: Expense) => void;
}


const expenseTypes = [
  { value: "one-time", label: "One-time" },
  { value: "subscription", label: "Subscription" },
  { value: "recurring", label: "Recurring" },
];

const frequencies = [
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "yearly", label: "Yearly" },
];

export default function ExpenseModal({
  isOpen,
  onClose,
  companies,
  expense,
  onSuccess,
}: ExpenseModalProps) {
  const isEditing = !!expense;
  const [categories, setCategories] = useState<
    { _id: string; name: string; color: string }[]
  >([]);
  const [tags, setTags] = useState<
    { _id: string; name: string; color: string }[]
  >([]);
  const [formData, setFormData] = useState({
    company: "",
    name: "",
    description: "",
    amount: "",
    category: "Other",
    expenseType: "one-time",
    frequency: "monthly",
    startDate: "",
    tags: "" as string,
    isActive: true,
    receipt: null as File | null,
    removeReceipt: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [scanningReceipt, setScanningReceipt] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  // Check if user has companies
  const hasCompanies = companies.length > 0;

  useEffect(() => {
    fetchCategoriesAndTags();
  }, []);

  useEffect(() => {
    if (expense) {
      // Pre-fill form for editing - show all fields for editing
      setFormData({
        company: expense.company._id,
        name: expense.name,
        description: expense.description || "",
        amount: expense.amount.toString(),
        category: expense.category,
        expenseType: expense.expenseType,
        frequency: expense.frequency || "monthly",
        startDate: expense.startDate ? expense.startDate.split("T")[0] : "",
        tags: expense.tags ? expense.tags.join(", ") : "",
        isActive: expense.isActive,
        receipt: null,
        removeReceipt: false,
      });
      setShowAdvanced(true); // Show all fields when editing
    } else if (hasCompanies && companies.length > 0) {
      setFormData((prev) => ({ ...prev, company: companies[0]._id }));
    }
  }, [expense, companies, hasCompanies]);

  // Set mounted state and reset showAdvanced for new expenses
  useEffect(() => {
    setMounted(true);
    if (!expense) {
      setShowAdvanced(false);
    }
  }, [expense]);

  const fetchCategoriesAndTags = async () => {
    try {
      const [categoriesRes, tagsRes] = await Promise.all([
        fetch("/api/categories"),
        fetch("/api/tags"),
      ]);

      if (categoriesRes.ok) {
        const categoriesData = await categoriesRes.json();
        // Ensure categoriesData is always an array
        setCategories(Array.isArray(categoriesData) ? categoriesData : []);
      }

      if (tagsRes.ok) {
        const tagsData = await tagsRes.json();
        // Ensure tagsData is always an array
        setTags(Array.isArray(tagsData) ? tagsData : []);
      }
    } catch (error) {
      console.error("Error fetching categories and tags:", error);
      // Set to empty arrays on error
      setCategories([]);
      setTags([]);
    }
  };

  const resetForm = () => {
    if (!expense) {
      setFormData({
        company: hasCompanies ? companies[0]._id : "",
        name: "",
        description: "",
        amount: "",
        category: "Other",
        expenseType: "one-time",
        frequency: "monthly",
        startDate: "",
        tags: "",
        isActive: true,
        receipt: null,
        removeReceipt: false,
      });
    }
    setError("");
  };

  const scanReceipt = async (file: File) => {
    setScanningReceipt(true);

    try {
      // Create a canvas to extract text from image
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const img = new Image();

      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = URL.createObjectURL(file);
      });

      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);

      // For now, let's use a simple approach - extract text using a mock OCR
      // In a real implementation, you would use a proper OCR service like Tesseract.js
      const extractedInfo = await mockOCRExtraction(file);

      // Auto-fill the form with extracted information
      if (extractedInfo.amount) {
        setFormData((prev) => ({
          ...prev,
          amount: extractedInfo.amount || "",
        }));
      }
      if (extractedInfo.merchantName && !formData.name) {
        setFormData((prev) => ({
          ...prev,
          name: extractedInfo.merchantName || "",
        }));
      }
      if (extractedInfo.date) {
        setFormData((prev) => ({
          ...prev,
          startDate: extractedInfo.date || "",
        }));
      }
      if (extractedInfo.category) {
        setFormData((prev) => ({
          ...prev,
          category: extractedInfo.category || "",
        }));
      }
    } catch (error) {
      console.error("Receipt scanning failed:", error);
    } finally {
      setScanningReceipt(false);
    }
  };

  const mockOCRExtraction = async (
    file: File
  ): Promise<{
    amount?: string;
    merchantName?: string;
    date?: string;
    category?: string;
  }> => {
    // Simulate OCR processing delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Mock extraction based on file name or random data
    // In a real implementation, this would use actual OCR
    const fileName = file.name.toLowerCase();
    let mockData: {
      amount?: string;
      merchantName?: string;
      category?: string;
      date?: string;
    } = {};

    // Simple pattern matching based on common receipt patterns
    if (fileName.includes("restaurant") || fileName.includes("food")) {
      mockData = {
        amount: (Math.random() * 50 + 15).toFixed(2),
        merchantName: "Restaurant Expense",
        category: "Travel & Entertainment",
        date: new Date().toISOString().split("T")[0],
      };
    } else if (fileName.includes("gas") || fileName.includes("fuel")) {
      mockData = {
        amount: (Math.random() * 80 + 30).toFixed(2),
        merchantName: "Fuel Expense",
        category: "Travel & Entertainment",
        date: new Date().toISOString().split("T")[0],
      };
    } else if (fileName.includes("office") || fileName.includes("supplies")) {
      mockData = {
        amount: (Math.random() * 100 + 20).toFixed(2),
        merchantName: "Office Supplies",
        category: "Office & Supplies",
        date: new Date().toISOString().split("T")[0],
      };
    } else {
      // Generic expense
      mockData = {
        amount: (Math.random() * 150 + 25).toFixed(2),
        merchantName: "Business Expense",
        category: "Other",
        date: new Date().toISOString().split("T")[0],
      };
    }

    return mockData;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!hasCompanies) {
      setError("Please create a company first before adding expenses");
      return;
    }

    if (!formData.name.trim()) {
      setError("Expense name is required");
      return;
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      setError("Please enter a valid amount");
      return;
    }

    if (
      (formData.expenseType === "subscription" ||
        formData.expenseType === "recurring") &&
      !formData.frequency
    ) {
      setError("Frequency is required for subscription and recurring expenses");
      return;
    }

    if (
      (formData.expenseType === "subscription" ||
        formData.expenseType === "recurring") &&
      !formData.startDate
    ) {
      setError(
        "Start date is required for subscription and recurring expenses"
      );
      return;
    }

    setLoading(true);
    setError("");

    try {
      const tags = formData.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0);

      let receiptData: {
        receiptUrl?: string | null;
        receiptS3Key?: string | null;
        receiptFileName?: string | null;
        receiptContentType?: string | null;
      } = {};

      if (formData.receipt) {
        // Upload new file to S3
        const uploadFormData = new FormData();
        uploadFormData.append("receipt", formData.receipt);

        const uploadResponse = await fetch("/api/upload-receipt", {
          method: "POST",
          body: uploadFormData,
        });

        if (uploadResponse.ok) {
          const uploadResult = await uploadResponse.json();
          receiptData = {
            receiptUrl: uploadResult.url,
            receiptS3Key: uploadResult.key,
            receiptFileName: uploadResult.fileName,
            receiptContentType: uploadResult.contentType,
          };
        } else {
          throw new Error("Failed to upload receipt");
        }
      } else if (formData.removeReceipt) {
        // Explicitly remove receipt
        receiptData = {
          receiptUrl: null,
          receiptS3Key: null,
          receiptFileName: null,
          receiptContentType: null,
        };
      } else if (isEditing && expense?.receiptUrl) {
        // Keep existing receipt if editing and no changes
        receiptData = {
          receiptUrl: expense.receiptUrl,
          receiptS3Key: expense.receiptS3Key,
          receiptFileName: expense.receiptFileName,
          receiptContentType: expense.receiptContentType,
        };
      }

      const expenseData = {
        company: formData.company,
        name: formData.name.trim(),
        description: formData.description.trim() || formData.name.trim(),
        amount: parseFloat(formData.amount),
        currency: "USD",
        category: formData.category,
        expenseType: formData.expenseType,
        frequency:
          formData.expenseType === "subscription" ||
          formData.expenseType === "recurring"
            ? formData.frequency
            : undefined,
        startDate: formData.startDate || new Date().toISOString().split("T")[0],
        isActive: formData.isActive,
        tags,
        ...receiptData,
      };

      const url = expense ? `/api/expenses/${expense._id}` : "/api/expenses";
      const method = expense ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(expenseData),
      });

      if (response.ok) {
        const result = await response.json();
        onSuccess(result);
        resetForm();
        if (previewUrl) {
          URL.revokeObjectURL(previewUrl);
          setPreviewUrl(null);
        }
        onClose();
      } else {
        const errorData = await response.json();
        console.error("API Error:", errorData);

        // Provide user-friendly error messages
        let friendlyError =
          errorData.error ||
          `Failed to ${isEditing ? "update" : "create"} expense`;

        // Handle specific validation errors
        if (errorData.error && errorData.error.includes("validation failed")) {
          if (errorData.error.includes("nextBillingDate")) {
            friendlyError =
              "Start date is required for subscription and recurring expenses.";
          } else if (
            errorData.error.includes("Company reference is required")
          ) {
            friendlyError = "Please select a company for this expense.";
          } else if (errorData.error.includes("Expense name is required")) {
            friendlyError = "Please enter an expense name.";
          } else if (errorData.error.includes("Description is required")) {
            friendlyError = "Please enter a description for this expense.";
          } else if (errorData.error.includes("Amount is required")) {
            friendlyError = "Please enter a valid amount.";
          } else if (errorData.error.includes("frequency")) {
            friendlyError =
              "Frequency is required for subscription and recurring expenses.";
          } else {
            friendlyError = "Please check all required fields and try again.";
          }
        }

        setError(friendlyError);
      }
    } catch (error) {
      console.error("Expense submission error:", error);
      setError("Something went wrong. Please try again.");
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
      <div className="card max-w-2xl w-full my-8 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#E5E7EB]">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-[#006BFF] rounded-lg flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-semibold text-[#0B3558]">
              {isEditing ? "Edit Expense" : "Add New Expense"}
            </h2>
          </div>
          <div className="flex items-center space-x-2">
            {/* Quick Receipt Upload */}
            <label 
              htmlFor="quick-receipt-upload"
              className="p-2 text-[#476788] hover:text-[#006BFF] hover:bg-[#006BFF]/10 rounded-lg transition-colors cursor-pointer"
              title="Quick receipt upload"
            >
              <Camera className="w-5 h-5" />
              <input
                id="quick-receipt-upload"
                type="file"
                accept="image/*,application/pdf"
                onChange={async (e) => {
                  const file = e.target.files?.[0] || null;
                  if (file) {
                    setFormData((prev) => ({
                      ...prev,
                      receipt: file,
                      removeReceipt: false,
                    }));

                    // Create preview URL
                    if (file.type.startsWith("image/")) {
                      const url = URL.createObjectURL(file);
                      setPreviewUrl(url);
                    }
                  }
                }}
                className="hidden"
              />
            </label>
            <button
              onClick={onClose}
              className="p-2 text-[#476788] hover:text-[#0B3558] hover:bg-[#F8F9FB] rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {!hasCompanies ? (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg text-sm">
              You need to create a company first before adding expenses.
            </div>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-[#0B3558] mb-2">
                  Company
                </label>
                <select
                  value={formData.company}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      company: e.target.value,
                    }))
                  }
                  className="input-field w-full"
                  required
                >
                  {companies.map((company) => (
                    <option key={company._id} value={company._id}>
                      {company.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#0B3558] mb-2">
                  Expense Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  className="input-field w-full"
                  placeholder="Enter expense name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#0B3558] mb-2">
                  Amount (USD)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.amount}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, amount: e.target.value }))
                  }
                  className="input-field w-full"
                  placeholder="0.00"
                  required
                />
              </div>

              {/* Basic Fields - Always Show */}
              <div>
                <label className="block text-sm font-medium text-[#0B3558] mb-2">
                  Type
                </label>
                <select
                  value={formData.expenseType}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      expenseType: e.target.value,
                    }))
                  }
                  className="input-field w-full"
                >
                  {expenseTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Show frequency and start date for subscriptions/recurring */}
              {(formData.expenseType === "subscription" ||
                formData.expenseType === "recurring") && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#0B3558] mb-2">
                      Frequency
                    </label>
                    <select
                      value={formData.frequency}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          frequency: e.target.value,
                        }))
                      }
                      className="input-field w-full"
                    >
                      {frequencies.map((freq) => (
                        <option key={freq.value} value={freq.value}>
                          {freq.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#0B3558] mb-2">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          startDate: e.target.value,
                        }))
                      }
                      className="input-field w-full"
                    />
                  </div>
                </div>
              )}

              {/* Advanced Options Toggle */}
              {mounted && !isEditing && (
                <div className="border-t border-[#E5E7EB] pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="text-[#006BFF] hover:text-[#0052CC] text-sm font-medium flex items-center space-x-1"
                  >
                    <span>
                      {showAdvanced ? "Hide" : "Show"} advanced options
                    </span>
                    <span
                      className={`transform transition-transform ${
                        showAdvanced ? "rotate-180" : ""
                      }`}
                    >
                      ▼
                    </span>
                  </button>
                </div>
              )}

              {/* Advanced Fields - Show when editing or when toggle is on */}
              {mounted && (showAdvanced || isEditing) && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-[#0B3558] mb-2">
                      Category
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          category: e.target.value,
                        }))
                      }
                      className="input-field w-full"
                    >
                      {/* Default categories if user hasn't created any custom ones */}
                      {(!Array.isArray(categories) || categories.length === 0) && (
                        <>
                          <option value="Software & Subscriptions">
                            Software & Subscriptions
                          </option>
                          <option value="Office & Supplies">
                            Office & Supplies
                          </option>
                          <option value="Travel & Entertainment">
                            Travel & Entertainment
                          </option>
                          <option value="Marketing & Advertising">
                            Marketing & Advertising
                          </option>
                          <option value="Professional Services">
                            Professional Services
                          </option>
                          <option value="Insurance">Insurance</option>
                          <option value="Utilities">Utilities</option>
                          <option value="Rent & Leasing">Rent & Leasing</option>
                          <option value="Equipment">Equipment</option>
                          <option value="Other">Other</option>
                        </>
                      )}
                      {/* User-created categories */}
                      {Array.isArray(categories) && categories.map((category) => (
                        <option key={category._id} value={category.name}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                    {(!Array.isArray(categories) || categories.length === 0) && (
                      <p className="text-xs text-[#476788] mt-1">
                        <a
                          href="/categories"
                          className="text-[#006BFF] hover:underline"
                        >
                          Create custom categories
                        </a>{" "}
                        for better organization
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#0B3558] mb-2">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          description: e.target.value,
                        }))
                      }
                      className="input-field w-full"
                      placeholder="Optional description"
                      rows={3}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#0B3558] mb-2">
                      Tags
                    </label>
                    {tags.length > 0 && (
                      <div className="mb-2">
                        <p className="text-xs text-[#476788] mb-2">
                          Quick select:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {tags.map((tag) => {
                            const isSelected = formData.tags
                              .split(", ")
                              .includes(tag.name);
                            return (
                              <button
                                key={tag._id}
                                type="button"
                                onClick={() => {
                                  const currentTags = formData.tags
                                    .split(", ")
                                    .filter((t) => t.trim());
                                  if (isSelected) {
                                    const newTags = currentTags.filter(
                                      (t) => t !== tag.name
                                    );
                                    setFormData((prev) => ({
                                      ...prev,
                                      tags: newTags.join(", "),
                                    }));
                                  } else {
                                    const newTags = [...currentTags, tag.name];
                                    setFormData((prev) => ({
                                      ...prev,
                                      tags: newTags.join(", "),
                                    }));
                                  }
                                }}
                                className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                                  isSelected
                                    ? "bg-[#006BFF] text-white border-[#006BFF]"
                                    : "bg-white text-[#476788] border-[#E5E7EB] hover:border-[#006BFF]"
                                }`}
                                style={{
                                  backgroundColor: isSelected
                                    ? tag.color
                                    : undefined,
                                  borderColor: isSelected
                                    ? tag.color
                                    : undefined,
                                }}
                              >
                                {tag.name}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    <input
                      type="text"
                      value={formData.tags}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          tags: e.target.value,
                        }))
                      }
                      className="input-field w-full"
                      placeholder="Type new tags separated by commas"
                    />
                    {tags.length === 0 && (
                      <p className="text-xs text-[#476788] mt-1">
                        <a
                          href="/tags"
                          className="text-[#006BFF] hover:underline"
                        >
                          Create custom tags
                        </a>{" "}
                        for quick selection
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#0B3558] mb-2">
                      Receipt (Optional)
                    </label>

                    {/* Show existing receipt if editing */}
                    {isEditing &&
                      expense?.receiptUrl &&
                      !formData.receipt &&
                      !formData.removeReceipt && (
                        <div className="mb-3 p-3 border border-[#E5E7EB] rounded-lg">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <FileText className="w-4 h-4 text-[#006BFF]" />
                              <span className="text-sm text-[#476788]">
                                Current receipt attached
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                if (confirm("Remove current receipt?")) {
                                  // Set a flag to remove the receipt
                                  setFormData((prev) => ({
                                    ...prev,
                                    removeReceipt: true,
                                  }));
                                }
                              }}
                              className="text-red-600 hover:text-red-700 text-sm"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      )}

                    {/* Show receipt removal confirmation */}
                    {formData.removeReceipt && (
                      <div className="mb-3 p-3 border border-red-200 bg-red-50 rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-red-600">
                            Receipt will be removed when saved
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              setFormData((prev) => ({
                                ...prev,
                                removeReceipt: false,
                              }))
                            }
                            className="text-red-600 hover:text-red-700 text-sm underline"
                          >
                            Undo
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="space-y-3">
                      <div className="flex items-center space-x-4">
                        <input
                          type="file"
                          accept="image/*,application/pdf"
                          onChange={async (e) => {
                            const file = e.target.files?.[0] || null;
                            if (file) {
                              setFormData((prev) => ({
                                ...prev,
                                receipt: file,
                                removeReceipt: false,
                              }));

                              // Create preview URL
                              if (file.type.startsWith("image/")) {
                                const url = URL.createObjectURL(file);
                                setPreviewUrl(url);

                                // Auto-scan if not editing
                                if (!isEditing) {
                                  await scanReceipt(file);
                                }
                              } else {
                                setPreviewUrl(null);
                              }
                            } else {
                              setPreviewUrl(null);
                            }
                          }}
                          className="input-field w-full"
                        />
                        {formData.receipt && (
                          <div className="flex items-center space-x-2">
                            <div className="text-sm text-[#006BFF]">
                              {formData.receipt.name}
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setFormData((prev) => ({
                                  ...prev,
                                  receipt: null,
                                }));
                                if (previewUrl) {
                                  URL.revokeObjectURL(previewUrl);
                                  setPreviewUrl(null);
                                }
                              }}
                              className="text-red-600 hover:text-red-700 text-sm"
                            >
                              Remove
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Manual scan button */}
                      {formData.receipt &&
                        formData.receipt.type.startsWith("image/") && (
                          <div className="flex items-center space-x-2">
                            <button
                              type="button"
                              onClick={() => scanReceipt(formData.receipt!)}
                              disabled={scanningReceipt}
                              className="btn-secondary text-sm disabled:opacity-50"
                            >
                              {scanningReceipt
                                ? "Scanning..."
                                : "📷 Scan Receipt"}
                            </button>
                            <span className="text-xs text-[#476788]">
                              Extract info from receipt
                            </span>
                          </div>
                        )}

                      {scanningReceipt && (
                        <div className="flex items-center space-x-2 text-sm text-[#006BFF]">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#006BFF]"></div>
                          <span>Scanning receipt for information...</span>
                        </div>
                      )}

                      {/* Receipt Preview */}
                      {previewUrl && (
                        <div className="mt-3">
                          <div className="border border-[#E5E7EB] rounded-lg overflow-hidden">
                            <NextImage
                              src={previewUrl}
                              alt="Receipt Preview"
                              width={400}
                              height={300}
                              className="max-w-full h-auto max-h-48 object-contain"
                            />
                          </div>
                          <p className="text-xs text-[#476788] mt-1">
                            Receipt preview
                          </p>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-[#476788] mt-1">
                      Upload receipt image or PDF (Max 10MB). Images will be
                      automatically scanned to fill expense details.
                    </p>
                  </div>

                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="isActive"
                      checked={formData.isActive}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          isActive: e.target.checked,
                        }))
                      }
                      className="w-4 h-4 text-[#006BFF] border-gray-300 rounded focus:ring-[#006BFF]"
                    />
                    <label
                      htmlFor="isActive"
                      className="text-sm font-medium text-[#0B3558]"
                    >
                      Active expense
                    </label>
                  </div>
                </>
              )}
            </>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-4">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !hasCompanies}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading
                ? isEditing
                  ? "Updating..."
                  : "Creating..."
                : isEditing
                ? "Update Expense"
                : "Create Expense"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
