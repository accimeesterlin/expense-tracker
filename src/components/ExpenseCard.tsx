import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  CreditCard,
  Building2,
  Calendar,
  Edit,
  Trash2,
  FileText,
  ChevronDown,
  ChevronUp,
  Hash,
  DollarSign,
} from "lucide-react";
import CompanyLogo from "./CompanyLogo";

interface Company {
  _id: string;
  name: string;
  industry?: string;
  domain?: string;
}

interface Expense {
  _id: string;
  name: string;
  description?: string;
  amount: number;
  category: string;
  expenseType: string;
  nextBillingDate?: string;
  paymentDate?: string;
  company: Company;
  isActive: boolean;
  budget?: string;
  tags?: string[];
  metadata?: {
    companyDomain?: string;
    companyBrandId?: string;
    expenseDomain?: string;
    expenseBrandId?: string;
  };
}

interface ExpenseCardProps {
  expense: Expense;
  onEdit: () => void;
  onDelete: () => void;
  onQuickUpdate?: (expenseId: string, field: string, value: any) => void;
  availableCategories?: string[];
  availableTags?: string[];
  availableBudgets?: Array<{ _id: string; name: string; totalAmount: number }>;
  availableCompanies?: Array<{ _id: string; name: string; domain?: string }>;
}

export default function ExpenseCard({
  expense,
  onEdit,
  onDelete,
  onQuickUpdate,
  availableCategories = [],
  availableTags = [],
  availableBudgets = [],
  availableCompanies = [],
}: ExpenseCardProps) {
  const router = useRouter();
  const [quickEdit, setQuickEdit] = useState<{
    field: string | null;
    value: string;
  }>({ field: null, value: "" });
  const [showFullDescription, setShowFullDescription] = useState(false);
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

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't navigate if clicking on interactive elements or in edit mode
    const target = e.target as HTMLElement;
    
    if (
      quickEdit.field ||
      target.closest("button") ||
      target.closest("input") ||
      target.closest("select") ||
      target.closest("textarea") ||
      target.closest("[data-no-navigate]") ||
      target.dataset.noNavigate === "true"
    ) {
      return;
    }
    
    router.push(`/expenses/${expense._id}`);
  };

  const handleQuickEdit = async (field: string, value: any) => {
    if (onQuickUpdate) {
      await onQuickUpdate(expense._id, field, value);
      setQuickEdit({ field: null, value: "" });
    }
  };

  const startQuickEdit = (field: string, currentValue: string) => {
    setQuickEdit({ field, value: currentValue });
  };

  const cancelQuickEdit = () => {
    setQuickEdit({ field: null, value: "" });
  };

  return (
    <div
      className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
      onClick={handleCardClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <CompanyLogo
              companyName={expense.name}
              domain={expense.metadata?.expenseDomain}
              size="md"
              showAttribution={false}
              className="w-10 h-10"
            />
            <div className="flex-1">
              {quickEdit.field === "name" ? (
                <input
                  type="text"
                  value={quickEdit.value}
                  onChange={(e) =>
                    setQuickEdit((prev) => ({ ...prev, value: e.target.value }))
                  }
                  onBlur={() => handleQuickEdit("name", quickEdit.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter")
                      handleQuickEdit("name", quickEdit.value);
                    if (e.key === "Escape") cancelQuickEdit();
                  }}
                  className="font-semibold text-gray-900 text-lg bg-transparent border-b-2 border-blue-300 focus:outline-none focus:border-blue-500 w-full"
                  autoFocus
                />
              ) : (
                <h3
                  className="font-semibold text-gray-900 text-lg cursor-pointer hover:text-blue-600 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onQuickUpdate) {
                      startQuickEdit("name", expense.name);
                    }
                  }}
                  title={onQuickUpdate ? "Click to edit title" : undefined}
                >
                  {expense.name}
                </h3>
              )}
              <div className="flex items-center space-x-2 mt-1">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getExpenseTypeColor(
                    expense.expenseType
                  )}`}
                >
                  {expense.expenseType}
                </span>
                {quickEdit.field === "category" ? (
                  <select
                    value={quickEdit.value}
                    onChange={(e) =>
                      setQuickEdit((prev) => ({
                        ...prev,
                        value: e.target.value,
                      }))
                    }
                    onBlur={() => handleQuickEdit("category", quickEdit.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter")
                        handleQuickEdit("category", quickEdit.value);
                      if (e.key === "Escape") cancelQuickEdit();
                    }}
                    className="text-xs px-2 py-1 border border-blue-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                    autoFocus
                  >
                    {availableCategories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium cursor-pointer hover:opacity-80 transition-opacity ${getCategoryColor(
                      expense.category
                    )}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onQuickUpdate &&
                      availableCategories.length > 0 &&
                      startQuickEdit("category", expense.category);
                    }}
                    data-no-navigate="true"
                    title={
                      onQuickUpdate && availableCategories.length > 0
                        ? "Click to change category"
                        : undefined
                    }
                  >
                    {expense.category}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            {/* Company quick edit */}
            {quickEdit.field === "company" ? (
              <div className="flex items-center space-x-2 text-sm">
                <Building2 className="w-4 h-4 text-gray-600" />
                <select
                  value={quickEdit.value}
                  onChange={(e) =>
                    setQuickEdit((prev) => ({
                      ...prev,
                      value: e.target.value,
                    }))
                  }
                  onBlur={() => handleQuickEdit("company", quickEdit.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter")
                      handleQuickEdit("company", quickEdit.value);
                    if (e.key === "Escape") cancelQuickEdit();
                  }}
                  className="text-sm px-2 py-1 border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 flex-1"
                  autoFocus
                >
                  {availableCompanies.map((company) => (
                    <option key={company._id} value={company._id}>
                      {company.name}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div
                className="flex items-center space-x-2 text-sm text-gray-600 cursor-pointer hover:bg-gray-50 p-1 rounded transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  onQuickUpdate &&
                  availableCompanies.length > 0 &&
                  startQuickEdit("company", expense.company._id);
                }}
                data-no-navigate="true"
                title={
                  onQuickUpdate && availableCompanies.length > 0
                    ? "Click to change company"
                    : undefined
                }
              >
                <Building2 className="w-4 h-4" />
                <span>{expense.company.name}</span>
              </div>
            )}
            {expense.paymentDate && (
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Calendar className="w-4 h-4" />
                <span>
                  Paid:{" "}
                  {new Date(expense.paymentDate).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>
            )}
            {expense.nextBillingDate && (
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Calendar className="w-4 h-4" />
                <span>
                  Next:{" "}
                  {new Date(expense.nextBillingDate).toLocaleDateString(
                    "en-US",
                    {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    }
                  )}
                </span>
              </div>
            )}

            {/* Description quick edit */}
            {quickEdit.field === "description" ? (
              <div className="mt-3 space-y-2">
                <textarea
                  value={quickEdit.value}
                  onChange={(e) =>
                    setQuickEdit((prev) => ({ ...prev, value: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm resize-none"
                  rows={2}
                  placeholder="Enter description..."
                  autoFocus
                />
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() =>
                      handleQuickEdit("description", quickEdit.value)
                    }
                    className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
                  >
                    Save
                  </button>
                  <button
                    onClick={cancelQuickEdit}
                    className="px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-3">
                {expense.description ? (
                  <div className="space-y-1">
                    <div
                      className="flex items-start space-x-2 cursor-pointer hover:bg-gray-50 p-1 rounded transition-colors"
                      onClick={() =>
                        onQuickUpdate &&
                        startQuickEdit("description", expense.description || "")
                      }
                      title={
                        onQuickUpdate ? "Click to edit description" : undefined
                      }
                    >
                      <FileText className="w-3 h-3 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-xs text-gray-600">
                          {showFullDescription ||
                          expense.description.length <= 100
                            ? expense.description
                            : `${expense.description.substring(0, 100)}...`}
                        </p>
                        {expense.description.length > 100 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowFullDescription(!showFullDescription);
                            }}
                            className="text-xs text-blue-600 hover:text-blue-700 font-medium mt-1 flex items-center space-x-1"
                          >
                            <span>
                              {showFullDescription ? "Show less" : "Show more"}
                            </span>
                            {showFullDescription ? (
                              <ChevronUp className="w-3 h-3" />
                            ) : (
                              <ChevronDown className="w-3 h-3" />
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  onQuickUpdate && (
                    <div
                      className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-1 rounded transition-colors text-gray-400"
                      onClick={() => startQuickEdit("description", "")}
                      title="Click to add description"
                    >
                      <FileText className="w-3 h-3" />
                      <p className="text-xs italic">Add description...</p>
                    </div>
                  )
                )}
              </div>
            )}

            {/* Budget quick edit */}
            <div className="mt-2">
              {quickEdit.field === "budget" ? (
                <select
                  value={quickEdit.value}
                  onChange={(e) =>
                    setQuickEdit((prev) => ({
                      ...prev,
                      value: e.target.value,
                    }))
                  }
                  onBlur={() => handleQuickEdit("budget", quickEdit.value || null)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter")
                      handleQuickEdit("budget", quickEdit.value || null);
                    if (e.key === "Escape") cancelQuickEdit();
                  }}
                  className="text-xs px-2 py-1 border border-blue-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                >
                  <option value="">No budget</option>
                  {availableBudgets.map((budget) => (
                    <option key={budget._id} value={budget._id}>
                      {budget.name} (${budget.totalAmount})
                    </option>
                  ))}
                </select>
              ) : (
                <div
                  className="flex items-center space-x-1 cursor-pointer hover:bg-gray-50 p-1 rounded transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onQuickUpdate && availableBudgets.length > 0) {
                      const defaultValue = expense.budget || (availableBudgets.length > 0 ? availableBudgets[0]._id : "");
                      startQuickEdit("budget", defaultValue);
                    }
                  }}
                  data-no-navigate="true"
                  title={
                    onQuickUpdate && availableBudgets.length > 0
                      ? "Click to assign budget"
                      : undefined
                  }
                >
                  <DollarSign className="w-3 h-3 text-gray-400" />
                  {expense.budget ? (
                    <span className="text-xs text-blue-600 font-medium">
                      {availableBudgets.find(b => b._id === expense.budget)?.name || "Unknown Budget"}
                    </span>
                  ) : (
                    <span className="text-xs text-gray-400 italic">
                      {availableBudgets.length > 0 ? "Assign to budget..." : "No budgets available"}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Tags quick edit */}
            <div className="mt-2">
              {quickEdit.field === "tags" ? (
                <div className="space-y-2">
                  <select
                    multiple
                    size={Math.min(availableTags.length + 1, 4)}
                    value={quickEdit.value.split(",").filter(Boolean)}
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
                    className="text-xs px-2 py-1 border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                  >
                    {availableTags.map((tag) => (
                      <option key={tag} value={tag}>
                        {tag}
                      </option>
                    ))}
                  </select>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() =>
                        handleQuickEdit("tags", quickEdit.value.split(",").filter(Boolean))
                      }
                      className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
                    >
                      Save
                    </button>
                    <button
                      onClick={cancelQuickEdit}
                      className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded hover:bg-gray-200 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  className="flex items-start space-x-1 cursor-pointer hover:bg-gray-50 p-1 rounded transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    onQuickUpdate &&
                    availableTags.length > 0 &&
                    startQuickEdit("tags", (expense.tags || []).join(","));
                  }}
                  data-no-navigate="true"
                  title={
                    onQuickUpdate && availableTags.length > 0
                      ? "Click to edit tags"
                      : undefined
                  }
                >
                  <Hash className="w-3 h-3 text-gray-400 mt-0.5" />
                  <div className="flex-1">
                    {expense.tags && expense.tags.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {expense.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400 italic">
                        {availableTags.length > 0 ? "Add tags..." : "No tags available"}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end space-y-2 ml-4">
          <span className="text-2xl font-bold text-gray-900">
            ${expense.amount.toFixed(2)}
          </span>

          <div className="flex items-center space-x-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                router.push(`/expenses/${expense._id}`);
              }}
              className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
              title="View details"
            >
              <FileText className="w-4 h-4" />
            </button>
            <button
              onClick={onEdit}
              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="Edit expense"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={onDelete}
              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Delete expense"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
