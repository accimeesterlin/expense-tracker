import { useRouter } from "next/navigation";
import { CreditCard, Building2, Calendar, Edit, Trash2 } from "lucide-react";

interface Company {
  _id: string;
  name: string;
  industry?: string;
}

interface Expense {
  _id: string;
  name: string;
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
}

export default function ExpenseCard({
  expense,
  onEdit,
  onDelete,
}: ExpenseCardProps) {
  const router = useRouter();
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
    // Don't navigate if clicking on buttons
    if ((e.target as HTMLElement).closest('button')) return;
    router.push(`/expenses/${expense._id}`);
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
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(
                    expense.category
                  )}`}
                >
                  {expense.category}
                </span>
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
