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
  nextBillingDate?: string;
  company: Company;
  isActive: boolean;
  receiptUrl?: string;
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
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [error, setError] = useState("");
  const [newComment, setNewComment] = useState("");
  const [addingComment, setAddingComment] = useState(false);
  const [quickEdit, setQuickEdit] = useState({
    field: null as string | null,
    value: "",
  });

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

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/auth/signin");
      return;
    }
    fetchExpense();
    fetchCompanies();
  }, [session, status, router, params.id, fetchExpense, fetchCompanies]);

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

  const handleQuickEdit = async (field: string, value: string) => {
    try {
      const response = await fetch(`/api/expenses/${params.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ [field]: value }),
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
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push("/")}
              className="text-[#476788] hover:text-[#0B3558] transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-[#006BFF] rounded-xl flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-semibold text-[#0B3558]">
                {expense.name}
              </h1>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowEditModal(true)}
              className="btn-secondary inline-flex items-center space-x-2"
            >
              <Edit className="w-4 h-4" />
              <span>Edit</span>
            </button>
            <button
              onClick={handleDelete}
              className="btn-secondary text-red-600 hover:text-red-700 hover:bg-red-50 inline-flex items-center space-x-2"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete</span>
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
                  <div className="flex items-center space-x-2">
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
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-sm font-medium ${getCategoryColor(
                        expense.category
                      )}`}
                    >
                      {expense.category}
                    </span>
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

              {expense.tags && expense.tags.length > 0 && (
                <div className="mt-6">
                  <label className="block text-sm font-medium text-[#476788] mb-2">
                    Tags
                  </label>
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
                </div>
              )}

              {expense.description && (
                <div className="mt-6">
                  <label className="block text-sm font-medium text-[#476788] mb-2">
                    Description
                  </label>
                  <div className="flex items-start space-x-2">
                    <FileText className="w-4 h-4 text-[#476788] mt-1" />
                    <p className="text-[#0B3558]">{expense.description}</p>
                  </div>
                </div>
              )}
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
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-[#0B3558]">
                    Receipt
                  </h2>
                  <button
                    onClick={handleRemoveReceipt}
                    className="btn-secondary text-red-600 hover:text-red-700 hover:bg-red-50 text-sm"
                  >
                    Remove Receipt
                  </button>
                </div>

                {expense.receiptUrl.startsWith("data:image") ? (
                  <div className="border border-[#E5E7EB] rounded-lg overflow-hidden">
                    <Image
                      src={expense.receiptUrl}
                      alt="Receipt"
                      width={400}
                      height={384}
                      className="max-w-full h-auto max-h-96 object-contain"
                    />
                  </div>
                ) : expense.receiptUrl.startsWith("data:application/pdf") ? (
                  <div className="border border-[#E5E7EB] rounded-lg p-4 text-center">
                    <FileText className="w-12 h-12 text-[#006BFF] mx-auto mb-2" />
                    <p className="text-[#476788]">PDF Receipt</p>
                    <a
                      href={expense.receiptUrl}
                      download="receipt.pdf"
                      className="text-[#006BFF] hover:underline text-sm"
                    >
                      Download PDF
                    </a>
                  </div>
                ) : (
                  <div className="border border-[#E5E7EB] rounded-lg p-4 text-center">
                    <FileText className="w-12 h-12 text-[#476788] mx-auto mb-2" />
                    <p className="text-[#476788]">Receipt file attached</p>
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
                      <p className="text-[#0B3558] mb-2">{comment.text}</p>
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
