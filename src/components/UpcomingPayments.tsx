import { useState, useEffect } from "react";
import {
  Calendar,
  CreditCard,
  AlertTriangle,
  TrendingUp,
  Clock,
} from "lucide-react";

interface UpcomingPayment {
  id: string;
  name: string;
  amount: number;
  dueDate: string;
  type: "expense" | "debt" | "income";
  category?: string;
  paymentMethod?: {
    name: string;
    type: string;
    lastFourDigits?: string;
  };
  isOverdue?: boolean;
  daysUntilDue?: number;
}

export default function UpcomingPayments() {
  const [upcomingPayments, setUpcomingPayments] = useState<UpcomingPayment[]>(
    []
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUpcomingPayments();
  }, []);

  const fetchUpcomingPayments = async () => {
    try {
      const [expensesRes, debtsRes, incomeRes] = await Promise.all([
        fetch("/api/expenses?upcoming=true"),
        fetch("/api/debts?upcoming=true"),
        fetch("/api/income?upcoming=true"),
      ]);

      const payments: UpcomingPayment[] = [];

      if (expensesRes.ok) {
        const expenses = await expensesRes.json();
        expenses.forEach((expense: any) => {
          if (expense.nextBillingDate) {
            const dueDate = new Date(expense.nextBillingDate);
            const today = new Date();
            const daysUntilDue = Math.ceil(
              (dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
            );

            payments.push({
              id: expense._id,
              name: expense.name,
              amount: expense.amount,
              dueDate: expense.nextBillingDate,
              type: "expense",
              category: expense.category,
              paymentMethod: expense.paymentMethod,
              isOverdue: daysUntilDue < 0,
              daysUntilDue,
            });
          }
        });
      }

      if (debtsRes.ok) {
        const debts = await debtsRes.json();
        debts.forEach((debt: any) => {
          const dueDate = new Date(debt.nextPaymentDate);
          const today = new Date();
          const daysUntilDue = Math.ceil(
            (dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
          );

          payments.push({
            id: debt._id,
            name: debt.name,
            amount: debt.minimumPayment,
            dueDate: debt.nextPaymentDate,
            type: "debt",
            category: debt.type,
            paymentMethod: debt.paymentMethod,
            isOverdue: daysUntilDue < 0,
            daysUntilDue,
          });
        });
      }

      if (incomeRes.ok) {
        const income = await incomeRes.json();
        income.forEach((inc: any) => {
          if (inc.nextPaymentDate) {
            const dueDate = new Date(inc.nextPaymentDate);
            const today = new Date();
            const daysUntilDue = Math.ceil(
              (dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
            );

            payments.push({
              id: inc._id,
              name: inc.source,
              amount: inc.amount,
              dueDate: inc.nextPaymentDate,
              type: "income",
              category: inc.category,
              paymentMethod: inc.paymentMethod,
              isOverdue: daysUntilDue < 0,
              daysUntilDue,
            });
          }
        });
      }

      // Sort by due date
      payments.sort(
        (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
      );
      setUpcomingPayments(payments);
    } catch (error) {
      console.error("Error fetching upcoming payments:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "expense":
        return <CreditCard className="w-4 h-4" />;
      case "debt":
        return <AlertTriangle className="w-4 h-4" />;
      case "income":
        return <TrendingUp className="w-4 h-4" />;
      default:
        return <Calendar className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: string, isOverdue?: boolean) => {
    if (isOverdue) return "text-red-600 bg-red-50";
    switch (type) {
      case "expense":
        return "text-red-600 bg-red-50";
      case "debt":
        return "text-orange-600 bg-orange-50";
      case "income":
        return "text-green-600 bg-green-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  const getDaysUntilDueText = (daysUntilDue?: number) => {
    if (!daysUntilDue) return "";
    if (daysUntilDue < 0) return `${Math.abs(daysUntilDue)} days overdue`;
    if (daysUntilDue === 0) return "Due today";
    if (daysUntilDue === 1) return "Due tomorrow";
    return `Due in ${daysUntilDue} days`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center space-x-3 mb-6">
        <Calendar className="w-6 h-6 text-blue-600" />
        <h2 className="text-xl font-semibold text-gray-900">
          Upcoming Payments
        </h2>
        <span className="bg-blue-100 text-blue-600 text-xs font-medium px-2.5 py-1 rounded-full">
          {upcomingPayments.length}
        </span>
      </div>

      {upcomingPayments.length === 0 ? (
        <div className="text-center py-12">
          <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">No upcoming payments</p>
          <p className="text-sm text-gray-400">
            Add expenses, debts, or income to see upcoming payments
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {upcomingPayments.slice(0, 10).map((payment) => (
            <div
              key={payment.id}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center space-x-4">
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center ${getTypeColor(
                    payment.type,
                    payment.isOverdue
                  )}`}
                >
                  {getTypeIcon(payment.type)}
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">{payment.name}</h3>
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <span>{formatDate(payment.dueDate)}</span>
                    {payment.paymentMethod && (
                      <>
                        <span>•</span>
                        <span>
                          {payment.paymentMethod.name}
                          {payment.paymentMethod.lastFourDigits &&
                            ` ****${payment.paymentMethod.lastFourDigits}`}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div
                  className={`font-semibold ${
                    payment.type === "income"
                      ? "text-green-600"
                      : "text-gray-900"
                  }`}
                >
                  {payment.type === "income" ? "+" : "-"}
                  {formatCurrency(payment.amount)}
                </div>
                <div
                  className={`text-sm ${
                    payment.isOverdue ? "text-red-600" : "text-gray-500"
                  }`}
                >
                  {getDaysUntilDueText(payment.daysUntilDue)}
                </div>
              </div>
            </div>
          ))}

          {upcomingPayments.length > 10 && (
            <div className="text-center pt-4">
              <button className="text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors">
                View All Payments →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
