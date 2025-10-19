import { Building2, CreditCard, TrendingUp, Calendar } from "lucide-react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

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
  const router = useRouter();
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
      href: "/companies",
    },
    {
      name: "Total Expenses",
      value: `$${totalExpenses.toFixed(2)}`,
      icon: CreditCard,
      color: "bg-green-500",
      textColor: "text-green-600",
      href: "/expenses",
    },
    {
      name: "Active Subscriptions",
      value: subscriptionExpenses.length,
      icon: TrendingUp,
      color: "bg-purple-500",
      textColor: "text-purple-600",
      href: "/expenses?type=subscription",
    },
    {
      name: "Upcoming Bills",
      value: upcomingSubscriptions.length,
      icon: Calendar,
      color: "bg-orange-500",
      textColor: "text-orange-600",
      href: "/expenses?type=upcoming",
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
      {stats.map((stat) => (
        <Card
          key={stat.name}
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => router.push(stat.href)}
        >
          <CardContent className="p-3 sm:p-4 lg:p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center">
              <div
                className={cn(
                  stat.color,
                  "rounded-lg p-2 sm:p-3 mb-2 sm:mb-0 sm:mr-3 lg:mr-4 flex-shrink-0"
                )}
              >
                <stat.icon className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-muted-foreground truncate">
                  {stat.name}
                </p>
                <p
                  className={cn(
                    "text-lg sm:text-xl lg:text-2xl font-bold truncate",
                    stat.textColor
                  )}
                >
                  {stat.value}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
