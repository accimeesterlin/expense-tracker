import { Calendar, AlertCircle } from "lucide-react";

interface Company {
  _id: string;
  name: string;
}

interface Expense {
  _id: string;
  name: string;
  amount: number;
  nextBillingDate?: string;
  company: Company;
  category: string;
}

interface UpcomingSubscriptionsProps {
  expenses: Expense[];
}

export default function UpcomingSubscriptions({
  expenses,
}: UpcomingSubscriptionsProps) {
  const upcomingExpenses = expenses
    .filter((expense) => expense.nextBillingDate)
    .sort(
      (a, b) =>
        new Date(a.nextBillingDate!).getTime() -
        new Date(b.nextBillingDate!).getTime()
    )
    .slice(0, 5);

  const getDaysUntil = (nextBillingDate: string) => {
    const today = new Date();
    const nextDate = new Date(nextBillingDate);
    const diffTime = nextDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getStatusColor = (daysUntil: number) => {
    if (daysUntil < 0) return "text-red-600 bg-red-100";
    if (daysUntil <= 7) return "text-orange-600 bg-orange-100";
    if (daysUntil <= 30) return "text-yellow-600 bg-yellow-100";
    return "text-green-600 bg-green-100";
  };

  const getStatusText = (daysUntil: number) => {
    if (daysUntil < 0) return "Overdue";
    if (daysUntil === 0) return "Due Today";
    if (daysUntil === 1) return "Due Tomorrow";
    if (daysUntil <= 7) return `Due in ${daysUntil} days`;
    if (daysUntil <= 30) return `Due in ${daysUntil} days`;
    return `Due in ${daysUntil} days`;
  };

  if (upcomingExpenses.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-4">
          <Calendar className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-900">
            Upcoming Subscriptions
          </h2>
        </div>
        <div className="text-center py-8">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No upcoming subscriptions</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center space-x-3 mb-6">
        <Calendar className="w-6 h-6 text-blue-600" />
        <h2 className="text-xl font-semibold text-gray-900">
          Upcoming Subscriptions
        </h2>
        <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
          {upcomingExpenses.length}
        </span>
      </div>

      <div className="space-y-4">
        {upcomingExpenses.map((expense) => {
          const daysUntil = getDaysUntil(expense.nextBillingDate!);
          const statusColor = getStatusColor(daysUntil);
          const statusText = getStatusText(daysUntil);

          return (
            <div
              key={expense._id}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200"
            >
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">{expense.name}</h3>
                  <p className="text-sm text-gray-600">
                    {expense.company.name} • {expense.category}
                  </p>
                  <p className="text-sm text-gray-500">
                    {new Date(expense.nextBillingDate!).toLocaleDateString(
                      "en-US",
                      {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      }
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <span className="text-lg font-semibold text-gray-900">
                  ${expense.amount.toFixed(2)}
                </span>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${statusColor}`}
                >
                  {statusText}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {expenses.filter((e) => e.nextBillingDate).length > 5 && (
        <div className="text-center pt-4">
          <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
            View All Subscriptions →
          </button>
        </div>
      )}
    </div>
  );
}
