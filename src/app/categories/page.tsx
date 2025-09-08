"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Tag, Edit, Trash2 } from "lucide-react";
import AppLayout from "@/components/AppLayout";

interface Category {
  _id: string;
  name: string;
  description?: string;
  color: string;
}

export default function CategoriesPage() {
  const { status } = useSession();
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
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
      const response = await fetch("/api/categories");
      if (response.ok) {
        const data = await response.json();
        // Ensure data is an array
        setCategories(Array.isArray(data) ? data : []);
      } else {
        console.error("Failed to fetch categories:", response.statusText);
        setCategories([]);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
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
      const url = editingCategory ? `/api/categories/${editingCategory._id}` : "/api/categories";
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
          setCategories(prev => prev.map(cat => 
            cat._id === editingCategory._id ? result : cat
          ));
        } else {
          setCategories(prev => [result, ...prev]);
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
        setCategories(prev => prev.filter(cat => cat._id !== category._id));
      } else {
        const errorData = await response.json();
        alert(errorData.error || "Failed to delete category");
      }
    } catch (error) {
      alert("Something went wrong. Please try again.");
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
      <div className="max-w-4xl mx-auto">
        {/* Form - Always visible */}
          <div className="card p-6 mb-8">
            <h2 className="text-lg font-semibold text-[#0B3558] mb-4">
              {editingCategory ? "Edit Category" : "Add New Category"}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#0B3558] mb-2">
                    Category Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
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
                    onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
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
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="input-field w-full"
                  placeholder="Enter category description"
                  rows={3}
                />
              </div>

              <div className="flex items-center justify-end space-x-3">
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
        <div className="card">
          <div className="p-6 border-b border-[#E5E7EB]">
            <h3 className="text-lg font-semibold text-[#0B3558]">
              Your Categories ({categories.length})
            </h3>
          </div>

          {categories.length === 0 ? (
            <div className="p-12 text-center">
              <Tag className="w-12 h-12 text-[#A6BBD1] mx-auto mb-4" />
              <p className="text-[#476788]">No categories created yet</p>
              <p className="text-sm text-[#A6BBD1]">Use the form above to create your first category</p>
            </div>
          ) : (
            <div className="divide-y divide-[#E5E7EB]">
              {categories.map((category) => (
                <div key={category._id} className="p-6 flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: category.color }}
                    />
                    <div>
                      <h4 className="font-medium text-[#0B3558]">{category.name}</h4>
                      {category.description && (
                        <p className="text-sm text-[#476788] mt-1">{category.description}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleEdit(category)}
                      className="p-2 text-[#476788] hover:text-[#0B3558] hover:bg-[#F8F9FB] rounded-lg transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(category)}
                      className="p-2 text-[#476788] hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}