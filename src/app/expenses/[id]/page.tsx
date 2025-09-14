"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import {
  ArrowLeft,
  Edit,
  Trash2,
  CreditCard,
  Building2,
  Calendar,
  DollarSign,
  Tag,
  Hash,
  Clock,
  FileText,
  CheckCircle,
  XCircle,
  Maximize2,
  Minimize2,
  RotateCcw,
  PiggyBank,
} from "lucide-react";
import ExpenseModal from "@/components/ExpenseModal";
import AppLayout from "@/components/AppLayout";

interface Company {
  _id: string;
  name: string;
  industry: string;
  description?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
  };
  contactInfo?: {
    email?: string;
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
  category: string;
  tags?: string[];
  expenseType: string;
  frequency?: string;
  startDate?: string;
  paymentDate?: string;
  nextBillingDate?: string;
  company: Company;
  isActive: boolean;
  budget?: string;
  receiptUrl?: string;
  receiptContentType?: string;
  comments: Array<{
    text: string;
    createdAt: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export default function ExpenseDetailPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const [expense, setExpense] = useState<Expense | null>(null);
  const [companies, setCompanies] = useState([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [budgets, setBudgets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [error, setError] = useState("");
  const [newComment, setNewComment] = useState("");
  const [addingComment, setAddingComment] = useState(false);
  const [editingComment, setEditingComment] = useState<{
    index: number;
    text: string;
  } | null>(null);
  const [quickEdit, setQuickEdit] = useState({
    field: null as string | null,
    value: "",
  });
  const [isImageExpanded, setIsImageExpanded] = useState(false);
  const [imageRotation, setImageRotation] = useState(0);

  const fetchExpense = useCallback(async () => {
    try {
      const response = await fetch(`/api/expenses/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setExpense(data);
      } else {
        setError("Failed to load expense");
      }
    } catch (error) {
      console.error("Error fetching expense:", error);
      setError("Failed to load expense");
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  const fetchCompanies = useCallback(async () => {
    try {
      const response = await fetch("/api/companies");
      if (response.ok) {
        const data = await response.json();
        setCompanies(data);
      }
    } catch (error) {
      console.error("Error fetching companies:", error);
    }
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      const response = await fetch("/api/categories");
      if (response.ok) {
        const data = await response.json();
        setCategories(data.map((cat: any) => cat.name));
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  }, []);

  const fetchTags = useCallback(async () => {
    try {
      const response = await fetch("/api/tags");
      if (response.ok) {
        const data = await response.json();
        setTags(data.map((tag: any) => tag.name));
      }
    } catch (error) {
      console.error("Error fetching tags:", error);
    }
  }, []);

  const fetchBudgets = useCallback(async () => {
    try {
      const response = await fetch("/api/v1/budgets");
      if (response.ok) {
        const data = await response.json();
        setBudgets(data.data || []);
      }
    } catch (error) {
      console.error("Error fetching budgets:", error);
    }
  }, []);

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/auth/signin");
      return;
    }
    fetchExpense();
    fetchCompanies();
    fetchCategories();
    fetchTags();
    fetchBudgets();
  }, [
    session,
    status,
    router,
    params.id,
    fetchExpense,
    fetchCompanies,
    fetchCategories,
    fetchTags,
    fetchBudgets,
  ]);

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this expense?")) return;

    try {
      const response = await fetch(`/api/expenses/${params.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        router.push("/");
      } else {
        setError("Failed to delete expense");
      }
    } catch (error) {
      console.error("Error deleting expense:", error);
      setError("Failed to delete expense");
    }
  };

  const handleExpenseUpdated = (updatedExpense: Expense) => {
    setExpense(updatedExpense);
    setShowEditModal(false);
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || addingComment) return;

    setAddingComment(true);
    try {
      const response = await fetch(`/api/expenses/${params.id}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: newComment.trim() }),
      });

      if (response.ok) {
        const updatedExpense = await response.json();
        setExpense(updatedExpense);
        setNewComment("");
      } else {
        setError("Failed to add comment");
      }
    } catch (error) {
      console.error("Error adding comment:", error);
      setError("Failed to add comment");
    } finally {
      setAddingComment(false);
    }
  };

  const handleEditComment = async (commentIndex: number) => {
    if (!editingComment || !editingComment.text.trim()) return;

    try {
      const response = await fetch(
        `/api/expenses/${params.id}/comments/${commentIndex}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ text: editingComment.text.trim() }),
        }
      );

      if (response.ok) {
        const updatedExpense = await response.json();
        setExpense(updatedExpense);
        setEditingComment(null);
      } else {
        setError("Failed to update comment");
      }
    } catch (error) {
      console.error("Error updating comment:", error);
      setError("Failed to update comment");
    }
  };

  const handleDeleteComment = async (commentIndex: number) => {
    if (!confirm("Are you sure you want to delete this comment?")) return;

    try {
      const response = await fetch(
        `/api/expenses/${params.id}/comments/${commentIndex}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        const updatedExpense = await response.json();
        setExpense(updatedExpense);
      } else {
        setError("Failed to delete comment");
      }
    } catch (error) {
      console.error("Error deleting comment:", error);
      setError("Failed to delete comment");
    }
  };

  const handleQuickEdit = async (field: string, value: string) => {
    try {
      let processedValue: any = value;
      if (field === "tags") {
        processedValue = value
          ? value.split(",").filter((tag) => tag.trim())
          : [];
      } else if (field === "isActive") {
        processedValue = value === "true";
      } else if (field === "amount") {
        processedValue = parseFloat(value);
      } else if (field === "budget") {
        processedValue = value || null;
      }

      const response = await fetch(`/api/expenses/${params.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ [field]: processedValue }),
      });

      if (response.ok) {
        const updatedExpense = await response.json();
        setExpense(updatedExpense);
        setQuickEdit({ field: null, value: "" });
      } else {
        setError("Failed to update expense");
      }
    } catch (error) {
      console.error("Error updating expense:", error);
      setError("Failed to update expense");
    }
  };

  const startQuickEdit = (field: string, currentValue: string) => {
    setQuickEdit({ field, value: currentValue });
  };

  const cancelQuickEdit = () => {
    setQuickEdit({ field: null, value: "" });
  };

  const handleRemoveReceipt = async () => {
    if (!confirm("Are you sure you want to remove this receipt?")) return;

    try {
      const response = await fetch(`/api/expenses/${params.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ receiptUrl: null }),
      });

      if (response.ok) {
        const updatedExpense = await response.json();
        setExpense(updatedExpense);
      } else {
        setError("Failed to remove receipt");
      }
    } catch (error) {
      console.error("Error removing receipt:", error);
      setError("Failed to remove receipt");
    }
  };

  const getExpenseTypeColor = (type: string) => {
    switch (type) {
      case "subscription":
        return "bg-purple-100 text-purple-800";
      case "recurring":
        return "bg-blue-100 text-blue-800";
      case "one-time":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getCategoryColor = (category: string) => {
    const colors = [
      "bg-red-100 text-red-800",
      "bg-orange-100 text-orange-800",
      "bg-yellow-100 text-yellow-800",
      "bg-green-100 text-green-800",
      "bg-blue-100 text-blue-800",
      "bg-indigo-100 text-indigo-800",
      "bg-purple-100 text-purple-800",
      "bg-pink-100 text-pink-800",
    ];
    const index = category.length % colors.length;
    return colors[index];
  };

  if (status === "loading" || loading) {
    return (
      <AppLayout title="Loading...">
        <div className="flex items-center justify-center min-h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#006BFF]"></div>
        </div>
      </AppLayout>
    );
  }

  if (!session) {
    return null;
  }

  if (error || !expense) {
    return (
      <AppLayout title="Error">
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">
              {error || "Expense not found"}
            </h1>
            <button
              onClick={() => router.push("/")}
              className="text-[#006BFF] hover:text-[#0052CC] font-medium"
            >
              ← Back to Dashboard
            </button>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Expense Details">
      <div className="max-w-4xl mx-auto">
        {/* Header Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-8">
          <div className="flex items-center space-x-2 sm:space-x-4 min-w-0 flex-1">
            <button
              onClick={() => router.push("/")}
              className="text-[#476788] hover:text-[#0B3558] transition-colors flex-shrink-0"
            >
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-[#006BFF] rounded-xl flex items-center justify-center flex-shrink-0">
                <CreditCard className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
              </div>
              {quickEdit.field === "name" ? (
                <div className="flex items-center space-x-2 flex-1">
                  <input
                    type="text"
                    value={quickEdit.value}
                    onChange={(e) =>
                      setQuickEdit((prev) => ({
                        ...prev,
                        value: e.target.value,
                      }))
                    }
                    className="input-field text-lg sm:text-xl lg:text-2xl font-semibold min-w-0 flex-1"
                    autoFocus
                  />
                  <button
                    onClick={() => handleQuickEdit("name", quickEdit.value)}
                    className="btn-primary text-sm px-3 py-1"
                  >
                    ✓
                  </button>
                  <button
                    onClick={cancelQuickEdit}
                    className="btn-secondary text-sm px-3 py-1"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <h1
                  className="text-lg sm:text-xl lg:text-2xl font-semibold text-[#0B3558] truncate cursor-pointer hover:text-[#006BFF] transition-colors"
                  onClick={() => startQuickEdit("name", expense.name)}
                  title="Click to edit title"
                >
                  {expense.name}
                </h1>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-2 w-full sm:w-auto justify-end flex-shrink-0">
            <button
              onClick={() => setShowEditModal(true)}
              className="btn-secondary inline-flex items-center space-x-1 sm:space-x-2 text-sm sm:text-base flex-1 sm:flex-none justify-center"
            >
              <Edit className="w-4 h-4" />
              <span className="hidden sm:inline">Edit</span>
            </button>
            <button
              onClick={handleDelete}
              className="btn-secondary text-red-600 hover:text-red-700 hover:bg-red-50 inline-flex items-center space-x-1 sm:space-x-2 text-sm sm:text-base flex-1 sm:flex-none justify-center"
            >
              <Trash2 className="w-4 h-4" />
              <span className="hidden sm:inline">Delete</span>
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Overview Card */}
            <div className="card p-6">
              <h2 className="text-xl font-semibold text-[#0B3558] mb-4">
                Expense Overview
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-[#476788] mb-1">
                    Amount
                  </label>
                  {quickEdit.field === "amount" ? (
                    <div className="flex items-center space-x-2">
                      <DollarSign className="w-5 h-5 text-[#006BFF]" />
                      <input
                        type="number"
                        step="0.01"
                        value={quickEdit.value}
                        onChange={(e) =>
                          setQuickEdit((prev) => ({
                            ...prev,
                            value: e.target.value,
                          }))
                        }
                        className="input-field text-2xl font-bold w-32"
                        autoFocus
                      />
                      <button
                        onClick={() =>
                          handleQuickEdit("amount", quickEdit.value)
                        }
                        className="btn-primary text-sm px-3 py-1"
                      >
                        ✓
                      </button>
                      <button
                        onClick={cancelQuickEdit}
                        className="btn-secondary text-sm px-3 py-1"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <DollarSign className="w-5 h-5 text-[#006BFF]" />
                      <span
                        className="text-3xl font-bold text-[#0B3558] cursor-pointer hover:text-[#006BFF] transition-colors"
                        onClick={() =>
                          startQuickEdit("amount", expense.amount.toString())
                        }
                        title="Click to edit amount"
                      >
                        ${expense.amount.toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#476788] mb-1">
                    Status
                  </label>
                  <div
                    className="flex items-center space-x-2 cursor-pointer hover:bg-[#F8F9FB] p-2 rounded-lg transition-colors"
                    onClick={() => handleQuickEdit("isActive", (!expense.isActive).toString())}
                    title="Click to toggle status"
                  >
                    {expense.isActive ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-500" />
                    )}
                    <span
                      className={`font-medium ${
                        expense.isActive ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {expense.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-[#476788] mb-2">
                    Category
                  </label>
                  <div className="flex items-center space-x-2">
                    <Tag className="w-4 h-4 text-[#476788]" />
                    {quickEdit.field === "category" ? (
                      <div className="flex items-center space-x-2">
                        <select
                          value={quickEdit.value}
                          onChange={(e) =>
                            setQuickEdit((prev) => ({
                              ...prev,
                              value: e.target.value,
                            }))
                          }
                          className="input-field text-sm"
                          autoFocus
                        >
                          {categories.map((category) => (
                            <option key={category} value={category}>
                              {category}
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={() =>
                            handleQuickEdit("category", quickEdit.value)
                          }
                          className="btn-primary text-sm px-3 py-1"
                        >
                          Save
                        </button>
                        <button
                          onClick={cancelQuickEdit}
                          className="btn-secondary text-sm px-3 py-1"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-sm font-medium cursor-pointer hover:opacity-80 transition-opacity ${getCategoryColor(
                          expense.category
                        )}`}
                        onClick={() =>
                          categories.length > 0 &&
                          startQuickEdit("category", expense.category)
                        }
                        title={
                          categories.length > 0
                            ? "Click to change category"
                            : undefined
                        }
                      >
                        {expense.category}
                      </span>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#476788] mb-2">
                    Type
                  </label>
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-[#476788]" />
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-sm font-medium ${getExpenseTypeColor(
                        expense.expenseType
                      )}`}
                    >
                      {expense.expenseType}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <label className="block text-sm font-medium text-[#476788] mb-2">
                  Tags
                </label>
                {quickEdit.field === "tags" ? (
                  <div className="flex flex-col space-y-2">
                    <select
                      multiple
                      size={5}
                      value={quickEdit.value.split(",")}
                      onChange={(e) => {
                        const selectedTags = Array.from(
                          e.target.selectedOptions,
                          (option) => option.value
                        );
                        setQuickEdit((prev) => ({
                          ...prev,
                          value: selectedTags.join(","),
                        }));
                      }}
                      className="input-field text-sm"
                      autoFocus
                    >
                      {tags.map((tag) => (
                        <option key={tag} value={tag}>
                          {tag}
                        </option>
                      ))}
                    </select>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleQuickEdit("tags", quickEdit.value)}
                        className="btn-primary text-sm px-3 py-1"
                      >
                        Save
                      </button>
                      <button
                        onClick={cancelQuickEdit}
                        className="btn-secondary text-sm px-3 py-1"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    {expense.tags && expense.tags.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {expense.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                          >
                            <Hash className="w-3 h-3 mr-1" />
                            {tag}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[#A6BBD1] italic">No tags assigned</p>
                    )}
                    {tags.length > 0 && (
                      <button
                        onClick={() =>
                          startQuickEdit("tags", (expense.tags || []).join(","))
                        }
                        className="mt-2 text-sm text-[#006BFF] hover:text-[#0052CC] font-medium"
                      >
                        Edit tags
                      </button>
                    )}
                  </div>
                )}
              </div>

              <div className="mt-6">
                <label className="block text-sm font-medium text-[#476788] mb-2">
                  Description
                </label>
                {quickEdit.field === "description" ? (
                  <div className="flex flex-col space-y-2">
                    <textarea
                      value={quickEdit.value}
                      onChange={(e) =>
                        setQuickEdit((prev) => ({
                          ...prev,
                          value: e.target.value,
                        }))
                      }
                      className="input-field w-full"
                      rows={3}
                      autoFocus
                    />
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() =>
                          handleQuickEdit("description", quickEdit.value)
                        }
                        className="btn-primary text-sm px-3 py-1"
                      >
                        Save
                      </button>
                      <button
                        onClick={cancelQuickEdit}
                        className="btn-secondary text-sm px-3 py-1"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start space-x-2">
                    <FileText className="w-4 h-4 text-[#476788] mt-1" />
                    <div className="flex-1">
                      {expense.description ? (
                        <p
                          className="text-[#0B3558] cursor-pointer hover:text-[#006BFF] transition-colors"
                          onClick={() =>
                            startQuickEdit(
                              "description",
                              expense.description || ""
                            )
                          }
                          title="Click to edit description"
                        >
                          {expense.description}
                        </p>
                      ) : (
                        <p
                          className="text-[#A6BBD1] italic cursor-pointer hover:text-[#006BFF] transition-colors"
                          onClick={() => startQuickEdit("description", "")}
                          title="Click to add description"
                        >
                          Click to add description...
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Budget Assignment */}
              <div className="mt-6">
                <label className="block text-sm font-medium text-[#476788] mb-2">
                  Budget Assignment
                </label>
                {quickEdit.field === "budget" ? (
                  <div className="flex flex-col space-y-2">
                    <select
                      value={quickEdit.value}
                      onChange={(e) =>
                        setQuickEdit((prev) => ({
                          ...prev,
                          value: e.target.value,
                        }))
                      }
                      className="input-field text-sm"
                      autoFocus
                    >
                      <option value="">No budget assigned</option>
                      {budgets.map((budget) => (
                        <option key={budget._id} value={budget._id}>
                          {budget.name} (${budget.totalAmount.toFixed(2)})
                        </option>
                      ))}
                    </select>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleQuickEdit("budget", quickEdit.value)}
                        className="btn-primary text-sm px-3 py-1"
                      >
                        Save
                      </button>
                      <button
                        onClick={cancelQuickEdit}
                        className="btn-secondary text-sm px-3 py-1"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <PiggyBank className="w-4 h-4 text-[#476788]" />
                    {expense.budget ? (
                      <span
                        className="inline-flex items-center px-2.5 py-1 rounded-full text-sm font-medium bg-[#006BFF]/10 text-[#006BFF] cursor-pointer hover:bg-[#006BFF]/20 transition-colors"
                        onClick={() =>
                          budgets.length > 0 &&
                          startQuickEdit("budget", expense.budget || "")
                        }
                        title={budgets.length > 0 ? "Click to change budget" : undefined}
                      >
                        {budgets.find(b => b._id === expense.budget)?.name || "Unknown Budget"}
                      </span>
                    ) : (
                      <span
                        className="text-[#A6BBD1] italic cursor-pointer hover:text-[#006BFF] transition-colors"
                        onClick={() => budgets.length > 0 && startQuickEdit("budget", "")}
                        title={budgets.length > 0 ? "Click to assign to budget" : undefined}
                      >
                        {budgets.length > 0 ? "Click to assign to budget..." : "No budgets available"}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Billing Information */}
            {(expense.expenseType === "subscription" ||
              expense.expenseType === "recurring") && (
              <div className="card p-6">
                <h2 className="text-xl font-semibold text-[#0B3558] mb-4">
                  Billing Information
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {expense.frequency && (
                    <div>
                      <label className="block text-sm font-medium text-[#476788] mb-1">
                        Frequency
                      </label>
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-[#006BFF]" />
                        <span className="text-[#0B3558] capitalize">
                          {expense.frequency}
                        </span>
                      </div>
                    </div>
                  )}
                  {expense.startDate && (
                    <div>
                      <label className="block text-sm font-medium text-[#476788] mb-1">
                        Start Date
                      </label>
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-[#006BFF]" />
                        <span className="text-[#0B3558]">
                          {new Date(expense.startDate).toLocaleDateString(
                            "en-US",
                            {
                              month: "long",
                              day: "numeric",
                              year: "numeric",
                            }
                          )}
                        </span>
                      </div>
                    </div>
                  )}
                  {expense.paymentDate && (
                    <div>
                      <label className="block text-sm font-medium text-[#476788] mb-1">
                        Payment Date
                      </label>
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-green-600" />
                        <span className="text-[#0B3558]">
                          {new Date(expense.paymentDate).toLocaleDateString(
                            "en-US",
                            {
                              month: "long",
                              day: "numeric",
                              year: "numeric",
                            }
                          )}
                        </span>
                      </div>
                    </div>
                  )}
                  {expense.nextBillingDate && (
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-[#476788] mb-1">
                        Next Billing Date
                      </label>
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-[#006BFF]" />
                        <span className="text-[#0B3558] font-medium">
                          {new Date(expense.nextBillingDate).toLocaleDateString(
                            "en-US",
                            {
                              month: "long",
                              day: "numeric",
                              year: "numeric",
                            }
                          )}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Receipt Section */}
            {expense.receiptUrl && (
              <div className="card p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
                  <h2 className="text-lg sm:text-xl font-semibold text-[#0B3558]">
                    Receipt
                  </h2>
                  <div className="flex items-center flex-wrap gap-2 sm:gap-3 w-full sm:w-auto">
                    <button
                      onClick={() => setIsImageExpanded(!isImageExpanded)}
                      className="btn-secondary text-[#006BFF] hover:text-[#0052CC] text-xs sm:text-sm flex-1 sm:flex-none text-center inline-flex items-center justify-center space-x-1 sm:space-x-2 min-w-0 py-2 sm:py-2.5 px-3 sm:px-4 min-h-[40px] sm:min-h-auto"
                    >
                      {isImageExpanded ? (
                        <>
                          <Minimize2 className="w-4 h-4 sm:w-4 sm:h-4 flex-shrink-0" />
                          <span className="hidden sm:inline truncate">
                            Collapse
                          </span>
                          <span className="sm:hidden text-xs truncate">Small</span>
                        </>
                      ) : (
                        <>
                          <Maximize2 className="w-4 h-4 sm:w-4 sm:h-4 flex-shrink-0" />
                          <span className="hidden sm:inline truncate">
                            Expand
                          </span>
                          <span className="sm:hidden text-xs truncate">Large</span>
                        </>
                      )}
                    </button>
                    <button
                      onClick={() =>
                        setImageRotation((prev) => (prev + 90) % 360)
                      }
                      className="btn-secondary text-[#006BFF] hover:text-[#0052CC] text-xs sm:text-sm flex-1 sm:flex-none text-center inline-flex items-center justify-center space-x-1 sm:space-x-2 min-w-0 py-2 sm:py-2.5 px-3 sm:px-4 min-h-[40px] sm:min-h-auto"
                    >
                      <RotateCcw className="w-4 h-4 sm:w-4 sm:h-4 flex-shrink-0" />
                      <span className="hidden sm:inline truncate">Rotate</span>
                      <span className="sm:hidden text-xs truncate">↻</span>
                    </button>
                    <a
                      href={expense.receiptUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-secondary text-[#006BFF] hover:text-[#0052CC] text-xs sm:text-sm flex-1 sm:flex-none text-center inline-flex items-center justify-center space-x-1 sm:space-x-2 min-w-0 py-2 sm:py-2.5 px-3 sm:px-4 min-h-[40px] sm:min-h-auto"
                    >
                      <Maximize2 className="w-4 h-4 sm:w-4 sm:h-4 flex-shrink-0 sm:hidden" />
                      <span className="hidden sm:inline truncate">
                        Open Full Size
                      </span>
                      <span className="sm:hidden text-xs truncate">Full</span>
                    </a>
                    <button
                      onClick={handleRemoveReceipt}
                      className="btn-secondary text-red-600 hover:text-red-700 hover:bg-red-50 text-xs sm:text-sm flex-1 sm:flex-none text-center inline-flex items-center justify-center space-x-1 sm:space-x-2 min-w-0 py-2 sm:py-2.5 px-3 sm:px-4 min-h-[40px] sm:min-h-auto"
                    >
                      <Trash2 className="w-4 h-4 sm:w-4 sm:h-4 flex-shrink-0 sm:hidden" />
                      <span className="hidden sm:inline truncate">
                        Remove Receipt
                      </span>
                      <span className="sm:hidden text-xs truncate">Remove</span>
                    </button>
                  </div>
                </div>

                {expense.receiptUrl.startsWith("data:image") ||
                expense.receiptContentType?.startsWith("image/") ||
                expense.receiptUrl.match(/\.(jpg|jpeg|png|gif|webp)(\?|$)/i) ? (
                  <div
                    className="border border-[#E5E7EB] rounded-lg overflow-hidden bg-gray-50 cursor-pointer"
                    onClick={() => setIsImageExpanded(!isImageExpanded)}
                  >
                    <div className="relative">
                      <Image
                        src={expense.receiptUrl}
                        alt="Receipt"
                        width={isImageExpanded ? 800 : 400}
                        height={isImageExpanded ? 600 : 300}
                        className={`w-full h-auto object-contain transition-all duration-300 ${
                          isImageExpanded
                            ? "max-h-[600px]"
                            : "max-h-[250px] sm:max-h-[300px]"
                        }`}
                        style={{ transform: `rotate(${imageRotation}deg)` }}
                        unoptimized={
                          expense.receiptUrl.startsWith("data:") ||
                          expense.receiptUrl.includes("amazonaws.com")
                        }
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          const parent = target.parentElement;
                          if (parent) {
                            parent.innerHTML = `
                              <div class="flex flex-col items-center justify-center p-8 text-gray-500 min-h-[200px]">
                                <svg class="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                                </svg>
                                <p class="text-gray-600 mb-2">Image could not be loaded</p>
                                <a href="${expense.receiptUrl}" target="_blank" class="text-blue-600 hover:underline">
                                  Try opening in new tab →
                                </a>
                              </div>
                            `;
                          }
                        }}
                      />
                      {!isImageExpanded && (
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
                      )}
                      {!isImageExpanded && (
                        <div className="absolute bottom-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
                          Click to expand
                        </div>
                      )}
                    </div>
                  </div>
                ) : expense.receiptUrl.startsWith("data:application/pdf") ||
                  expense.receiptContentType === "application/pdf" ||
                  expense.receiptUrl.match(/\.pdf(\?|$)/i) ? (
                  <div className="border border-[#E5E7EB] rounded-lg p-8 text-center bg-gray-50">
                    <FileText className="w-16 h-16 text-[#006BFF] mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-[#0B3558] mb-2">
                      PDF Receipt
                    </h3>
                    <p className="text-[#476788] mb-4">
                      Click below to view the PDF receipt
                    </p>
                    <a
                      href={expense.receiptUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-primary inline-flex items-center space-x-2"
                    >
                      <FileText className="w-4 h-4" />
                      <span>View PDF Receipt</span>
                    </a>
                  </div>
                ) : (
                  <div className="border border-[#E5E7EB] rounded-lg p-8 text-center bg-gray-50">
                    <FileText className="w-16 h-16 text-[#476788] mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-[#0B3558] mb-2">
                      Receipt File
                    </h3>
                    <p className="text-[#476788] mb-4">
                      Receipt file is attached to this expense
                    </p>
                    <a
                      href={expense.receiptUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-primary inline-flex items-center space-x-2"
                    >
                      <FileText className="w-4 h-4" />
                      <span>View Receipt File</span>
                    </a>
                  </div>
                )}
              </div>
            )}

            {/* Comments Section */}
            <div className="card p-6">
              <h2 className="text-xl font-semibold text-[#0B3558] mb-4">
                Comments ({expense.comments?.length || 0})
              </h2>

              {/* Add Comment */}
              <div className="mb-6">
                <div className="flex space-x-3">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="input-field flex-1"
                    placeholder="Add a comment..."
                    rows={3}
                    maxLength={500}
                  />
                  <button
                    onClick={handleAddComment}
                    disabled={!newComment.trim() || addingComment}
                    className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed self-start"
                  >
                    {addingComment ? "Adding..." : "Add"}
                  </button>
                </div>
                <div className="text-xs text-[#476788] mt-1">
                  {newComment.length}/500 characters
                </div>
              </div>

              {/* Comments List */}
              {expense.comments && expense.comments.length > 0 ? (
                <div className="space-y-4">
                  {expense.comments.map((comment, index) => (
                    <div
                      key={index}
                      className="border-l-4 border-[#006BFF] pl-4 py-2"
                    >
                      {editingComment?.index === index ? (
                        <div className="space-y-3">
                          <textarea
                            value={editingComment.text}
                            onChange={(e) =>
                              setEditingComment({
                                ...editingComment,
                                text: e.target.value,
                              })
                            }
                            className="input-field w-full"
                            rows={3}
                            maxLength={500}
                          />
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleEditComment(index)}
                              className="btn-primary text-sm px-3 py-1"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingComment(null)}
                              className="btn-secondary text-sm px-3 py-1"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div className="flex items-start justify-between group">
                            <p className="text-[#0B3558] mb-2 flex-1">
                              {comment.text}
                            </p>
                            <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() =>
                                  setEditingComment({
                                    index,
                                    text: comment.text,
                                  })
                                }
                                className="p-1 text-[#476788] hover:text-[#006BFF] rounded transition-colors"
                                title="Edit comment"
                              >
                                <Edit className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => handleDeleteComment(index)}
                                className="p-1 text-[#476788] hover:text-red-600 rounded transition-colors"
                                title="Delete comment"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                          <p className="text-xs text-[#476788]">
                            {new Date(comment.createdAt).toLocaleDateString(
                              "en-US",
                              {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                                hour: "numeric",
                                minute: "2-digit",
                              }
                            )}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[#476788] text-center py-4">
                  No comments yet. Add the first comment above.
                </p>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Company Info */}
            <div className="card p-6">
              <h2 className="text-xl font-semibold text-[#0B3558] mb-4">
                Company
              </h2>
              <div className="flex items-start space-x-3">
                <div className="w-12 h-12 bg-[#006BFF]/10 rounded-lg flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-[#006BFF]" />
                </div>
                <div>
                  <h3 className="font-medium text-[#0B3558]">
                    {expense.company.name}
                  </h3>
                  {expense.company.industry && (
                    <p className="text-sm text-[#476788] mt-1">
                      {expense.company.industry}
                    </p>
                  )}
                  {expense.company.address && (
                    <p className="text-sm text-[#476788] mt-1">
                      {expense.company.address.city},{" "}
                      {expense.company.address.state}
                    </p>
                  )}
                  {expense.company.contactInfo?.email && (
                    <p className="text-sm text-[#476788] mt-1">
                      {expense.company.contactInfo.email}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Timestamps */}
            <div className="card p-6">
              <h2 className="text-xl font-semibold text-[#0B3558] mb-4">
                Timeline
              </h2>
              <div className="space-y-4">
                {expense.paymentDate && (
                  <div>
                    <label className="block text-sm font-medium text-[#476788] mb-1">
                      Purchase Date
                    </label>
                    <p className="text-sm text-[#0B3558]">
                      {new Date(expense.paymentDate).toLocaleDateString(
                        "en-US",
                        {
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        }
                      )}
                    </p>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-[#476788] mb-1">
                    Created
                  </label>
                  <p className="text-sm text-[#0B3558]">
                    {new Date(expense.createdAt).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#476788] mb-1">
                    Last Updated
                  </label>
                  <p className="text-sm text-[#0B3558]">
                    {new Date(expense.updatedAt).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Edit Modal */}
        {showEditModal && (
          <ExpenseModal
            isOpen={showEditModal}
            onClose={() => setShowEditModal(false)}
            companies={companies}
            expense={expense}
            onSuccess={handleExpenseUpdated}
          />
        )}
      </div>
    </AppLayout>
  );
}
