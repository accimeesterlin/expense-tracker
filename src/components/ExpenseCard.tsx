import { useRouter } from "next/navigation";
import { useState } from "react";
import { CreditCard, Building2, Calendar, Edit, Trash2, FileText } from "lucide-react";

interface Company {
  _id: string;
  name: string;
  industry?: string;
}

interface Expense {
  _id: string;
  name: string;
  description?: string;
  amount: number;
  category: string;
  expenseType: string;
  nextBillingDate?: string;
  company: Company;
  isActive: boolean;
}

interface ExpenseCardProps {
  expense: Expense;
  onEdit: () => void;
  onDelete: () => void;
  onQuickUpdate?: (expenseId: string, field: string, value: string) => void;
  availableCategories?: string[];
}

export default function ExpenseCard({
  expense,
  onEdit,
  onDelete,
  onQuickUpdate,
  availableCategories = [],
}: ExpenseCardProps) {
  const router = useRouter();
  const [quickEdit, setQuickEdit] = useState<{
    field: string | null;
    value: string;
  }>({ field: null, value: "" });
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
    // Don't navigate if clicking on buttons or in edit mode
    if ((e.target as HTMLElement).closest('button') || quickEdit.field) return;
    router.push(`/expenses/${expense._id}`);
  };

  const handleQuickEdit = async (field: string, value: string) => {
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
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-green-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 text-lg">
                {expense.name}
              </h3>
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
                      setQuickEdit((prev) => ({ ...prev, value: e.target.value }))
                    }
                    onBlur={() => handleQuickEdit("category", quickEdit.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleQuickEdit("category", quickEdit.value);
                      if (e.key === "Escape") cancelQuickEdit();
                    }}
                    className="text-xs px-2 py-1 border border-blue-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                    autoFocus
                  >
                    {availableCategories.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                ) : (
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium cursor-pointer hover:opacity-80 transition-opacity ${getCategoryColor(
                      expense.category
                    )}`}
                    onClick={() => onQuickUpdate && availableCategories.length > 0 && startQuickEdit("category", expense.category)}
                    title={onQuickUpdate && availableCategories.length > 0 ? "Click to change category" : undefined}
                  >
                    {expense.category}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Building2 className="w-4 h-4" />
              <span>{expense.company.name}</span>
            </div>
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
                    onClick={() => handleQuickEdit("description", quickEdit.value)}
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
                  <div className="flex items-start space-x-2 cursor-pointer hover:bg-gray-50 p-1 rounded transition-colors"
                    onClick={() => onQuickUpdate && startQuickEdit("description", expense.description || "")}
                    title={onQuickUpdate ? "Click to edit description" : undefined}
                  >
                    <FileText className="w-3 h-3 text-gray-400 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-gray-600">{expense.description}</p>
                  </div>
                ) : onQuickUpdate && (
                  <div className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-1 rounded transition-colors text-gray-400"
                    onClick={() => startQuickEdit("description", "")}
                    title="Click to add description"
                  >
                    <FileText className="w-3 h-3" />
                    <p className="text-xs italic">Add description...</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col items-end space-y-2 ml-4">
          <span className="text-2xl font-bold text-gray-900">
            ${expense.amount.toFixed(2)}
          </span>

          <div className="flex items-center space-x-2">
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
