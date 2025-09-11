"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Tag, Edit, Trash2, CreditCard, ArrowRight } from "lucide-react";
import AppLayout from "@/components/AppLayout";
import ErrorModal from "@/components/ErrorModal";

interface Category {
  _id: string;
  name: string;
  description?: string;
  color: string;
  expenseCount?: number;
}

export default function CategoriesPage() {
  const { status } = useSession();
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [expenseCounts, setExpenseCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [showForm] = useState(true); // Always show form
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    color: "#006BFF",
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorModal, setErrorModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
  }>({
    isOpen: false,
    title: "",
    message: "",
  });

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated") {
      router.push("/auth/signin");
      return;
    }
    fetchCategories();
  }, [status, router]);

  const fetchCategories = async () => {
    try {
      const [categoriesRes, expensesRes] = await Promise.all([
        fetch("/api/categories"),
        fetch("/api/expenses")
      ]);

      if (categoriesRes.ok) {
        const data = await categoriesRes.json();
        setCategories(Array.isArray(data) ? data : []);
      } else {
        console.error("Failed to fetch categories:", categoriesRes.statusText);
        setCategories([]);
      }

      if (expensesRes.ok) {
        const expenses = await expensesRes.json();
        const counts: Record<string, number> = {};
        expenses.forEach((expense: any) => {
          counts[expense.category] = (counts[expense.category] || 0) + 1;
        });
        setExpenseCounts(counts);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      setError("Category name is required");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const url = editingCategory
        ? `/api/categories/${editingCategory._id}`
        : "/api/categories";
      const method = editingCategory ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name.trim(),
          description: formData.description.trim() || undefined,
          color: formData.color,
        }),
      });

      if (response.ok) {
        const result = await response.json();

        if (editingCategory) {
          setCategories((prev) =>
            prev.map((cat) => (cat._id === editingCategory._id ? result : cat))
          );
        } else {
          setCategories((prev) => [result, ...prev]);
        }

        setFormData({ name: "", description: "", color: "#006BFF" });
        setEditingCategory(null);
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to save category");
      }
    } catch (error) {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || "",
      color: category.color,
    });
    setError("");
  };

  const handleDelete = async (category: Category) => {
    if (!confirm(`Are you sure you want to delete "${category.name}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/categories/${category._id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setCategories((prev) => prev.filter((cat) => cat._id !== category._id));
      } else {
        const errorData = await response.json();
        setErrorModal({
          isOpen: true,
          title: "Delete Failed",
          message: errorData.error || "Failed to delete category",
        });
      }
    } catch (error) {
      setErrorModal({
        isOpen: true,
        title: "Delete Failed",
        message: "Something went wrong. Please try again.",
      });
    }
  };

  const handleCancel = () => {
    setEditingCategory(null);
    setFormData({ name: "", description: "", color: "#006BFF" });
    setError("");
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-[#F8F9FB] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#006BFF]"></div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return null;
  }

  return (
    <AppLayout title="Categories">
      <div className="max-w-4xl mx-auto w-full overflow-x-hidden">
        {/* Form - Always visible */}
        <div className="card p-4 sm:p-6 mb-6 sm:mb-8">
          <h2 className="text-base sm:text-lg font-semibold text-[#0B3558] mb-3 sm:mb-4">
            {editingCategory ? "Edit Category" : "Add New Category"}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-sm font-medium text-[#0B3558] mb-2">
                  Category Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  className="input-field w-full"
                  placeholder="Enter category name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#0B3558] mb-2">
                  Color
                </label>
                <input
                  type="color"
                  value={formData.color}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, color: e.target.value }))
                  }
                  className="input-field w-full h-10"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#0B3558] mb-2">
                Description (Optional)
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
                placeholder="Enter category description"
                rows={3}
              />
            </div>

            <div className="flex items-center justify-end space-x-2 sm:space-x-3">
              <button
                type="button"
                onClick={handleCancel}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting
                  ? "Saving..."
                  : editingCategory
                  ? "Update Category"
                  : "Create Category"}
              </button>
            </div>
          </form>
        </div>

        {/* Categories List */}
        <div className="card w-full overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-[#E5E7EB]">
            <h3 className="text-base sm:text-lg font-semibold text-[#0B3558]">
              Your Categories ({categories.length})
            </h3>
          </div>

          {categories.length === 0 ? (
            <div className="p-8 sm:p-12 text-center">
              <Tag className="w-10 h-10 sm:w-12 sm:h-12 text-[#A6BBD1] mx-auto mb-3 sm:mb-4" />
              <p className="text-sm sm:text-base text-[#476788]">
                No categories created yet
              </p>
              <p className="text-xs sm:text-sm text-[#A6BBD1]">
                Use the form above to create your first category
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[#E5E7EB]">
              {categories.map((category) => (
                <div
                  key={category._id}
                  className="p-4 sm:p-6 flex items-center justify-between w-full overflow-hidden hover:bg-[#F8F9FB] transition-colors group"
                >
                  <Link 
                    href={`/expenses?category=${encodeURIComponent(category.name)}`}
                    className="flex items-center space-x-3 sm:space-x-4 min-w-0 flex-1 cursor-pointer"
                  >
                    <div
                      className="w-3 h-3 sm:w-4 sm:h-4 rounded-full flex-shrink-0"
                      style={{ backgroundColor: category.color }}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-medium text-[#0B3558] text-sm sm:text-base truncate group-hover:text-[#006BFF] transition-colors">
                          {category.name}
                        </h4>
                        <div className="flex items-center space-x-1 text-[#476788]">
                          <CreditCard className="w-3 h-3" />
                          <span className="text-xs font-medium">
                            {expenseCounts[category.name] || 0}
                          </span>
                        </div>
                        <ArrowRight className="w-3 h-3 text-[#A6BBD1] group-hover:text-[#006BFF] transition-colors" />
                      </div>
                      {category.description && (
                        <p className="text-xs sm:text-sm text-[#476788] mt-1 truncate">
                          {category.description}
                        </p>
                      )}
                    </div>
                  </Link>

                  <div className="flex items-center space-x-1 sm:space-x-2 ml-2">
                    <button
                      onClick={() => handleEdit(category)}
                      className="p-1.5 sm:p-2 text-[#476788] hover:text-[#0B3558] hover:bg-[#F8F9FB] rounded-lg transition-colors"
                    >
                      <Edit className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(category)}
                      className="p-1.5 sm:p-2 text-[#476788] hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Error Modal */}
      <ErrorModal
        isOpen={errorModal.isOpen}
        onClose={() => setErrorModal({ ...errorModal, isOpen: false })}
        title={errorModal.title}
        message={errorModal.message}
      />
    </AppLayout>
  );
}
