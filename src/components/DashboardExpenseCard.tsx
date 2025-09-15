import { useRouter } from "next/navigation";
import CompanyLogo from "./CompanyLogo";

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
  company: Company;
  metadata?: {
    companyDomain?: string;
    companyBrandId?: string;
    expenseDomain?: string;
    expenseBrandId?: string;
  };
}

interface DashboardExpenseCardProps {
  expense: Expense;
}

export default function DashboardExpenseCard({ expense }: DashboardExpenseCardProps) {
  const router = useRouter();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      Travel: "bg-blue-100 text-blue-800",
      Entertainment: "bg-purple-100 text-purple-800",
      "Office Supplies": "bg-green-100 text-green-800",
      Marketing: "bg-pink-100 text-pink-800",
      Technology: "bg-indigo-100 text-indigo-800",
      Other: "bg-gray-100 text-gray-800",
    };
    return colors[category as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  const handleClick = () => {
    router.push(`/expenses/${expense._id}`);
  };

  return (
    <div
      className="bg-white border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow cursor-pointer"
      onClick={handleClick}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          <CompanyLogo
            companyName={expense.name}
            domain={expense.metadata?.expenseDomain}
            size="sm"
            showAttribution={false}
            className="w-8 h-8 flex-shrink-0"
          />
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-gray-900 text-sm truncate">
              {expense.name}
            </h3>
            <div className="flex items-center space-x-2 mt-1">
              <span className="text-xs text-gray-500 truncate">
                {expense.company.name}
              </span>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(
                  expense.category
                )}`}
              >
                {expense.category}
              </span>
            </div>
          </div>
        </div>
        <div className="text-right flex-shrink-0 ml-2">
          <span className="font-semibold text-gray-900 text-sm">
            {formatCurrency(expense.amount)}
          </span>
        </div>
      </div>
    </div>
  );
}