"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Tag, Edit, Trash2, CreditCard, ArrowRight } from "lucide-react";
import AppLayout from "@/components/AppLayout";
import ErrorModal from "@/components/ErrorModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";

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
  const [expenseCounts, setExpenseCounts] = useState<Record<string, number>>(
    {}
  );
  const [loading, setLoading] = useState(true);
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
        fetch("/api/expenses"),
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
        expenses.forEach((expense: { category: string }) => {
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
    } catch {
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
    } catch {
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
        <Card className="mb-6 sm:mb-8">
          <CardHeader>
            <CardTitle>
              {editingCategory ? "Edit Category" : "Add New Category"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Category Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, name: e.target.value }))
                    }
                    placeholder="Enter category name"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="color">Color</Label>
                  <Input
                    id="color"
                    type="color"
                    value={formData.color}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        color: e.target.value,
                      }))
                    }
                    className="h-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  placeholder="Enter category description"
                  rows={3}
                />
              </div>

              <div className="flex items-center justify-end gap-2">
                <Button type="button" variant="outline" onClick={handleCancel}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting
                    ? "Saving..."
                    : editingCategory
                      ? "Update Category"
                      : "Create Category"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Categories List */}
        <Card>
          <CardHeader>
            <CardTitle>Your Categories ({categories.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {categories.length === 0 ? (
              <div className="p-12 text-center">
                <Tag className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                <p className="text-muted-foreground">
                  No categories created yet
                </p>
                <p className="text-sm text-muted-foreground">
                  Use the form above to create your first category
                </p>
              </div>
            ) : (
              <div className="divide-y">
                {categories.map((category) => (
                  <div
                    key={category._id}
                    className="flex items-center justify-between p-4 transition-colors hover:bg-muted/50 sm:p-6"
                  >
                    <Link
                      href={`/expenses?category=${encodeURIComponent(category.name)}`}
                      className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 sm:gap-4"
                    >
                      <div
                        className="h-4 w-4 flex-shrink-0 rounded-full"
                        style={{ backgroundColor: category.color }}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="truncate font-medium transition-colors group-hover:text-primary">
                            {category.name}
                          </h4>
                          <Badge variant="secondary" className="gap-1">
                            <CreditCard className="h-3 w-3" />
                            <span className="text-xs">
                              {expenseCounts[category.name] || 0}
                            </span>
                          </Badge>
                          <ArrowRight className="h-3 w-3 text-muted-foreground transition-colors group-hover:text-primary" />
                        </div>
                        {category.description && (
                          <p className="mt-1 truncate text-sm text-muted-foreground">
                            {category.description}
                          </p>
                        )}
                      </div>
                    </Link>

                    <div className="ml-2 flex items-center gap-1 sm:gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(category)}
                        className="h-8 w-8"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(category)}
                        className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
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
