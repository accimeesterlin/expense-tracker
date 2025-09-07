import { useState, useEffect } from "react";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  CreditCard,
  Building2,
  PiggyBank,
  AlertTriangle,
  Calendar,
  PieChart,
  BarChart3,
} from "lucide-react";
import UpcomingPayments from "./UpcomingPayments";

interface FinancialDashboardProps {
  onAddIncome?: () => void;
  onAddDebt?: () => void;
}

interface DashboardStats {
  summary: {
    totalCompanies: number;
    totalExpenses: number;
    totalIncome: number;
    totalDebt: number;
    totalAssets: number;
    netWorth: number;
    monthlyRecurringExpenses: number;
    monthlyRecurringIncome: number;
    monthlyDebtPayments: number;
    monthlyCashFlow: number;
    totalPaymentMethods: number;
    activeDebts: number;
    totalAssets: number;
  };
  upcoming: {
    expenses: number;
    debtPayments: number;
    income: number;
  };
  breakdowns: {
    assetsByType: Record<string, number>;
    debtsByType: Record<string, number>;
    expensesByCategory: Record<string, number>;
    incomeByCategory: Record<string, number>;
  };
  counts: {
    companies: number;
    expenses: number;
    income: number;
    debts: number;
    assets: number;
    paymentMethods: number;
  };
}

export default function FinancialDashboard({
  onAddIncome,
  onAddDebt,
}: FinancialDashboardProps) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/dashboard/stats");
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center p-8">
        <p className="text-gray-500">Failed to load dashboard data</p>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const getCashFlowColor = (cashFlow: number) => {
    if (cashFlow > 0) return "text-green-600";
    if (cashFlow < 0) return "text-red-600";
    return "text-gray-600";
  };

  const getCashFlowIcon = (cashFlow: number) => {
    if (cashFlow > 0) return <TrendingUp className="w-5 h-5" />;
    if (cashFlow < 0) return <TrendingDown className="w-5 h-5" />;
    return <DollarSign className="w-5 h-5" />;
  };

  return (
    <div className="space-y-6">
      {/* Net Worth & Cash Flow Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Net Worth</p>
              <p className="text-3xl font-bold text-gray-900">
                {formatCurrency(stats.summary.netWorth)}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <PiggyBank className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Monthly Cash Flow
              </p>
              <p
                className={`text-3xl font-bold ${getCashFlowColor(
                  stats.summary.monthlyCashFlow
                )}`}
              >
                {formatCurrency(stats.summary.monthlyCashFlow)}
              </p>
            </div>
            <div
              className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                stats.summary.monthlyCashFlow > 0
                  ? "bg-green-100"
                  : stats.summary.monthlyCashFlow < 0
                  ? "bg-red-100"
                  : "bg-gray-100"
              }`}
            >
              <div className={getCashFlowColor(stats.summary.monthlyCashFlow)}>
                {getCashFlowIcon(stats.summary.monthlyCashFlow)}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Assets</p>
              <p className="text-3xl font-bold text-gray-900">
                {formatCurrency(stats.summary.totalAssets)}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Financial Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-4">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total Income</p>
              <p className="text-xl font-bold text-gray-900">
                {formatCurrency(stats.summary.totalIncome)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center mr-4">
              <TrendingDown className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">
                Total Expenses
              </p>
              <p className="text-xl font-bold text-gray-900">
                {formatCurrency(stats.summary.totalExpenses)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mr-4">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total Debt</p>
              <p className="text-xl font-bold text-gray-900">
                {formatCurrency(stats.summary.totalDebt)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
              <CreditCard className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">
                Payment Methods
              </p>
              <p className="text-xl font-bold text-gray-900">
                {stats.counts.paymentMethods}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Upcoming Payments */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <Calendar className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-900">
            Upcoming Payments (30 days)
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-4 bg-red-50 rounded-lg">
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <TrendingDown className="w-6 h-6 text-red-600" />
            </div>
            <p className="text-sm font-medium text-gray-600">Expenses Due</p>
            <p className="text-2xl font-bold text-red-600">
              {stats.upcoming.expenses}
            </p>
          </div>

          <div className="text-center p-4 bg-orange-50 rounded-lg">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <AlertTriangle className="w-6 h-6 text-orange-600" />
            </div>
            <p className="text-sm font-medium text-gray-600">Debt Payments</p>
            <p className="text-2xl font-bold text-orange-600">
              {stats.upcoming.debtPayments}
            </p>
          </div>

          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <p className="text-sm font-medium text-gray-600">Income Expected</p>
            <p className="text-2xl font-bold text-green-600">
              {stats.upcoming.income}
            </p>
          </div>
        </div>
      </div>

      {/* Monthly Recurring Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Monthly Income
            </h3>
            <TrendingUp className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-2xl font-bold text-green-600">
            {formatCurrency(stats.summary.monthlyRecurringIncome)}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Monthly Expenses
            </h3>
            <TrendingDown className="w-5 h-5 text-red-600" />
          </div>
          <p className="text-2xl font-bold text-red-600">
            {formatCurrency(stats.summary.monthlyRecurringExpenses)}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Monthly Debt
            </h3>
            <AlertTriangle className="w-5 h-5 text-orange-600" />
          </div>
          <p className="text-2xl font-bold text-orange-600">
            {formatCurrency(stats.summary.monthlyDebtPayments)}
          </p>
        </div>
      </div>

      {/* Asset & Debt Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3 mb-6">
            <PieChart className="w-6 h-6 text-green-600" />
            <h2 className="text-xl font-semibold text-gray-900">
              Assets by Type
            </h2>
          </div>
          <div className="space-y-3">
            {Object.entries(stats.breakdowns.assetsByType).map(
              ([type, amount]) => (
                <div key={type} className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600 capitalize">
                    {type.replace("_", " ")}
                  </span>
                  <span className="text-sm font-bold text-gray-900">
                    {formatCurrency(amount)}
                  </span>
                </div>
              )
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3 mb-6">
            <BarChart3 className="w-6 h-6 text-orange-600" />
            <h2 className="text-xl font-semibold text-gray-900">
              Debts by Type
            </h2>
          </div>
          <div className="space-y-3">
            {Object.entries(stats.breakdowns.debtsByType).map(
              ([type, amount]) => (
                <div key={type} className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600 capitalize">
                    {type.replace("_", " ")}
                  </span>
                  <span className="text-sm font-bold text-gray-900">
                    {formatCurrency(amount)}
                  </span>
                </div>
              )
            )}
          </div>
        </div>
      </div>

      {/* Upcoming Payments */}
      <UpcomingPayments />

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Quick Actions</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={onAddIncome}
            className="flex items-center space-x-3 p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
          >
            <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <div className="text-left">
              <h3 className="font-medium text-gray-900">Add Income</h3>
              <p className="text-sm text-gray-500">Track your earnings</p>
            </div>
          </button>
          <button
            onClick={onAddDebt}
            className="flex items-center space-x-3 p-4 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors"
          >
            <div className="w-10 h-10 bg-orange-600 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-white" />
            </div>
            <div className="text-left">
              <h3 className="font-medium text-gray-900">Add Debt</h3>
              <p className="text-sm text-gray-500">Track your liabilities</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
