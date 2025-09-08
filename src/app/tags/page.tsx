"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Hash, Edit, Trash2 } from "lucide-react";
import AppLayout from "@/components/AppLayout";

interface Tag {
  _id: string;
  name: string;
  color: string;
}

const predefinedColors = [
  "#006BFF",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#8B5CF6",
  "#EC4899",
  "#14B8A6",
  "#F97316",
  "#6366F1",
  "#84CC16",
];

export default function TagsPage() {
  const { status } = useSession();
  const router = useRouter();
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm] = useState(true); // Always show form
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [formData, setFormData] = useState({
    name: "",
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
    fetchTags();
  }, [status, router]);

  const fetchTags = async () => {
    try {
      const response = await fetch("/api/tags");
      if (response.ok) {
        const data = await response.json();
        setTags(data);
      }
    } catch (error) {
      console.error("Error fetching tags:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      setError("Tag name is required");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const url = editingTag ? `/api/tags/${editingTag._id}` : "/api/tags";
      const method = editingTag ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name.trim(),
          color: formData.color,
        }),
      });

      if (response.ok) {
        const result = await response.json();

        if (editingTag) {
          setTags((prev) =>
            prev.map((tag) => (tag._id === editingTag._id ? result : tag))
          );
        } else {
          setTags((prev) => [result, ...prev]);
        }

        setFormData({ name: "", color: "#006BFF" });
        setEditingTag(null);
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to save tag");
      }
    } catch (error) {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (tag: Tag) => {
    setEditingTag(tag);
    setFormData({
      name: tag.name,
      color: tag.color,
    });
    setError("");
  };

  const handleDelete = async (tag: Tag) => {
    if (!confirm(`Are you sure you want to delete "${tag.name}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/tags/${tag._id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setTags((prev) => prev.filter((t) => t._id !== tag._id));
      } else {
        const errorData = await response.json();
        alert(errorData.error || "Failed to delete tag");
      }
    } catch (error) {
      alert("Something went wrong. Please try again.");
    }
  };

  const handleCancel = () => {
    setEditingTag(null);
    setFormData({ name: "", color: "#006BFF" });
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
    <AppLayout title="Tags">
      <div className="max-w-4xl mx-auto w-full overflow-x-hidden">
        {/* Form - Always visible */}
        <div className="card p-4 sm:p-6 mb-6 sm:mb-8">
          <h2 className="text-base sm:text-lg font-semibold text-[#0B3558] mb-3 sm:mb-4">
            {editingTag ? "Edit Tag" : "Add New Tag"}
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
                  Tag Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  className="input-field w-full"
                  placeholder="Enter tag name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#0B3558] mb-2">
                  Color
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={formData.color}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        color: e.target.value,
                      }))
                    }
                    className="w-8 h-8 sm:w-10 sm:h-10 rounded border border-[#E5E7EB] cursor-pointer flex-shrink-0"
                  />
                  <div className="flex flex-wrap gap-1">
                    {predefinedColors.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() =>
                          setFormData((prev) => ({ ...prev, color }))
                        }
                        className={`w-5 h-5 sm:w-6 sm:h-6 rounded border-2 ${
                          formData.color === color
                            ? "border-[#0B3558]"
                            : "border-transparent"
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              </div>
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
                  : editingTag
                  ? "Update Tag"
                  : "Create Tag"}
              </button>
            </div>
          </form>
        </div>

        {/* Tags List */}
        <div className="card w-full overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-[#E5E7EB]">
            <h3 className="text-base sm:text-lg font-semibold text-[#0B3558]">
              Your Tags ({tags.length})
            </h3>
          </div>

          {tags.length === 0 ? (
            <div className="p-8 sm:p-12 text-center">
              <Hash className="w-10 h-10 sm:w-12 sm:h-12 text-[#A6BBD1] mx-auto mb-3 sm:mb-4" />
              <p className="text-sm sm:text-base text-[#476788]">
                No tags created yet
              </p>
              <p className="text-xs sm:text-sm text-[#A6BBD1]">
                Use the form above to create your first tag
              </p>
            </div>
          ) : (
            <div className="p-4 sm:p-6 w-full overflow-hidden">
              <div className="flex flex-wrap gap-2 w-full">
                {tags.map((tag) => (
                  <div
                    key={tag._id}
                    className="inline-flex items-center space-x-1.5 sm:space-x-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-full border border-[#E5E7EB] bg-white group hover:shadow-sm transition-shadow"
                  >
                    <div
                      className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: tag.color }}
                    />
                    <span className="text-xs sm:text-sm font-medium text-[#0B3558] truncate">
                      {tag.name}
                    </span>
                    <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleEdit(tag)}
                        className="p-0.5 sm:p-1 text-[#476788] hover:text-[#0B3558] rounded transition-colors"
                      >
                        <Edit className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                      </button>
                      <button
                        onClick={() => handleDelete(tag)}
                        className="p-0.5 sm:p-1 text-[#476788] hover:text-red-600 rounded transition-colors"
                      >
                        <Trash2 className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
