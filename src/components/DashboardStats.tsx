import { Building2, CreditCard, TrendingUp, Calendar } from "lucide-react";

interface Company {
  _id: string;
  name: string;
}

interface Expense {
  _id: string;
  amount: number;
  expenseType: string;
  nextBillingDate?: string;
}

interface DashboardStatsProps {
  companies: Company[];
  expenses: Expense[];
}

export default function DashboardStats({
  companies,
  expenses,
}: DashboardStatsProps) {
  const totalExpenses = expenses.reduce(
    (sum, expense) => sum + expense.amount,
    0
  );
  const subscriptionExpenses = expenses.filter(
    (expense) => expense.expenseType === "subscription"
  );
  const upcomingSubscriptions = expenses.filter((expense) => {
    if (!expense.nextBillingDate) return false;
    const nextDate = new Date(expense.nextBillingDate);
    const today = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(today.getDate() + 30);
    return nextDate >= today && nextDate <= thirtyDaysFromNow;
  });

  const stats = [
    {
      name: "Total Companies",
      value: companies.length,
      icon: Building2,
      color: "bg-blue-500",
      textColor: "text-blue-600",
    },
    {
      name: "Total Expenses",
      value: `$${totalExpenses.toFixed(2)}`,
      icon: CreditCard,
      color: "bg-green-500",
      textColor: "text-green-600",
    },
    {
      name: "Active Subscriptions",
      value: subscriptionExpenses.length,
      icon: TrendingUp,
      color: "bg-purple-500",
      textColor: "text-purple-600",
    },
    {
      name: "Upcoming Bills",
      value: upcomingSubscriptions.length,
      icon: Calendar,
      color: "bg-orange-500",
      textColor: "text-orange-600",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat) => (
        <div
          key={stat.name}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
        >
          <div className="flex items-center">
            <div className={`${stat.color} rounded-lg p-3 mr-4`}>
              <stat.icon className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">{stat.name}</p>
              <p className={`text-2xl font-bold ${stat.textColor}`}>
                {stat.value}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
