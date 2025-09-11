"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Building2,
  CreditCard,
  TrendingUp,
  DollarSign,
  LogOut,
  User,
  Settings,
  AlertTriangle,
  PiggyBank,
  Menu,
  Scan,
} from "lucide-react";
import CompanyModal from "@/components/CompanyModal";
import ExpenseModal from "@/components/ExpenseModal";
import CompanyCard from "@/components/CompanyCard";
import ExpenseCard from "@/components/ExpenseCard";
import DashboardStats from "@/components/DashboardStats";
import UpcomingSubscriptions from "@/components/UpcomingSubscriptions";
import FinancialDashboard from "@/components/FinancialDashboard";
import PaymentMethodModal from "@/components/PaymentMethodModal";
import IncomeModal from "@/components/IncomeModal";
import DebtModal from "@/components/DebtModal";
import SimpleIncomeModal from "@/components/SimpleIncomeModal";
import SimpleDebtModal from "@/components/SimpleDebtModal";
import AssetModal from "@/components/AssetModal";
import SettingsModal from "@/components/SettingsModal";
import GlobalSearch from "@/components/GlobalSearch";
import Sidebar from "@/components/Sidebar";
import ReceiptScannerModal from "@/components/ReceiptScannerModal";
import NotificationModal from "@/components/NotificationModal";
import type {
  Company,
  Expense,
  PaymentMethod,
  Income,
  Debt,
  Asset,
} from "@/types/shared";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showPaymentMethodModal, setShowPaymentMethodModal] = useState(false);
  const [showIncomeModal, setShowIncomeModal] = useState(false);
  const [showDebtModal, setShowDebtModal] = useState(false);
  const [showSimpleIncomeModal, setShowSimpleIncomeModal] = useState(false);
  const [showSimpleDebtModal, setShowSimpleDebtModal] = useState(false);
  const [showAssetModal, setShowAssetModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showReceiptScannerModal, setShowReceiptScannerModal] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [selectedExpense, setSelectedExpense] = useState<Expense | undefined>(
    undefined
  );
  const [selectedPaymentMethod, setSelectedPaymentMethod] =
    useState<PaymentMethod | null>(null);
  const [selectedIncome, setSelectedIncome] = useState<Income | null>(null);
  const [selectedDebt, setSelectedDebt] = useState<Debt | null>(null);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [activeTab, setActiveTab] = useState<"overview" | "financial">(
    "overview"
  );
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<{
    isOpen: boolean;
    type: "success" | "error";
    title: string;
    message: string;
  }>({
    isOpen: false,
    type: "success",
    title: "",
    message: "",
  });

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/auth/signin");
      return;
    }
    fetchData();
  }, [session, status, router]);

  const fetchData = async () => {
    try {
      const [companiesRes, expensesRes, paymentMethodsRes] = await Promise.all([
        fetch("/api/companies"),
        fetch("/api/expenses"),
        fetch("/api/payment-methods"),
      ]);

      if (companiesRes.ok) {
        const companiesData = await companiesRes.json();
        setCompanies(companiesData);
      }

      if (expensesRes.ok) {
        const expensesData = await expensesRes.json();
        setExpenses(expensesData);
      }

      if (paymentMethodsRes.ok) {
        const paymentMethodsData = await paymentMethodsRes.json();
        setPaymentMethods(paymentMethodsData);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCompanyCreated = (newCompany: Company) => {
    setCompanies((prev) => [newCompany, ...prev]);
    setShowCompanyModal(false);
  };

  const handleExpenseCreated = (newExpense: Expense) => {
    if (selectedExpense) {
      // Update existing expense
      setExpenses((prev) =>
        prev.map((e) => (e._id === newExpense._id ? newExpense : e))
      );
    } else {
      // Add new expense
      setExpenses((prev) => [newExpense, ...prev]);
    }
    setShowExpenseModal(false);
    setSelectedExpense(undefined);
  };

  const handleCompanyDeleted = (companyId: string) => {
    setCompanies((prev) => prev.filter((c) => c._id !== companyId));
    setExpenses((prev) => prev.filter((e) => e.company._id !== companyId));
  };

  const handleExpenseDeleted = async (expenseId: string) => {
    try {
      const response = await fetch(`/api/expenses/${expenseId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setExpenses((prev) => prev.filter((e) => e._id !== expenseId));
        setNotification({
          isOpen: true,
          type: "success",
          title: "Success",
          message: "Expense deleted successfully",
        });
      } else {
        const errorData = await response.json();
        setNotification({
          isOpen: true,
          type: "error",
          title: "Delete Failed",
          message: errorData.error || "Failed to delete expense",
        });
      }
    } catch (error) {
      console.error("Error deleting expense:", error);
      setNotification({
        isOpen: true,
        type: "error",
        title: "Delete Failed",
        message: "Failed to delete expense. Please try again.",
      });
    }
  };

  const handlePaymentMethodCreated = () => {
    setShowPaymentMethodModal(false);
    setSelectedPaymentMethod(null);
  };

  const handlePaymentMethodUpdated = () => {
    setShowPaymentMethodModal(false);
    setSelectedPaymentMethod(null);
  };

  const handleIncomeCreated = () => {
    setShowIncomeModal(false);
    setSelectedIncome(null);
  };

  const handleIncomeUpdated = () => {
    setShowIncomeModal(false);
    setSelectedIncome(null);
  };

  const handleDebtCreated = () => {
    setShowDebtModal(false);
    setSelectedDebt(null);
  };

  const handleDebtUpdated = () => {
    setShowDebtModal(false);
    setSelectedDebt(null);
  };

  const handleAssetCreated = () => {
    setShowAssetModal(false);
    setSelectedAsset(null);
  };

  const handleAssetUpdated = () => {
    setShowAssetModal(false);
    setSelectedAsset(null);
  };

  const handleReceiptScanned = async (expenseData: {
    name: string;
    description: string;
    amount: number;
    category: string;
    tags: string[];
    expenseType: string;
    receiptUrl: string;
    receiptS3Key: string;
    receiptFileName: string;
    receiptContentType: string;
  }) => {
    try {
      // Create the expense directly
      const response = await fetch("/api/expenses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          company: companies[0]?._id || "",
          name: expenseData.name,
          description: expenseData.description,
          amount: expenseData.amount,
          currency: "USD",
          category: expenseData.category,
          expenseType: expenseData.expenseType,
          startDate: new Date().toISOString().split("T")[0],
          isActive: true,
          tags: expenseData.tags,
          receiptUrl: expenseData.receiptUrl,
          receiptS3Key: expenseData.receiptS3Key,
          receiptFileName: expenseData.receiptFileName,
          receiptContentType: expenseData.receiptContentType,
        }),
      });

      if (response.ok) {
        const newExpense = await response.json();
        // Add the new expense to the list
        setExpenses((prev) => [newExpense, ...prev]);
        setShowReceiptScannerModal(false);

        setNotification({
          isOpen: true,
          type: "success",
          title: "Success",
          message: "Expense created successfully from receipt!",
        });
      } else {
        const errorData = await response.json();
        setNotification({
          isOpen: true,
          type: "error",
          title: "Failed to Create Expense",
          message: errorData.error || "Unknown error",
        });
      }
    } catch (error) {
      console.error("Error creating expense from receipt:", error);
      setNotification({
        isOpen: true,
        type: "error",
        title: "Error",
        message: "Failed to create expense. Please try again.",
      });
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-[#F8F9FB] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#006BFF]"></div>
      </div>
    );
  }

  if (!session) {
    return null; // Will redirect to signin
  }

  return (
    <div className="min-h-screen bg-[#F8F9FB] flex w-full overflow-x-hidden">
      {/* Sidebar */}
      <Sidebar isOpen={showSidebar} onClose={() => setShowSidebar(false)} />

      {/* Main content area */}
      <div className="flex-1 lg:ml-0 min-w-0 w-full overflow-x-hidden">
        {/* Header */}
        <header className="bg-white border-b border-[#E5E7EB] w-full overflow-x-hidden">
          <div className="w-full px-3 sm:px-4 lg:px-6 overflow-x-hidden">
            <div className="flex justify-between items-center h-16 min-w-0 gap-2">
              <div className="flex items-center space-x-1 sm:space-x-2 min-w-0 flex-shrink">
                <button
                  onClick={() => setShowSidebar(true)}
                  className="p-1.5 sm:p-2 text-[#476788] hover:text-[#0B3558] hover:bg-[#F8F9FB] rounded-lg transition-colors lg:hidden flex-shrink-0"
                >
                  <Menu className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
                <div className="w-8 h-8 lg:w-10 lg:h-10 bg-[#006BFF] rounded-xl items-center justify-center lg:hidden flex-shrink-0 hidden sm:flex">
                  <DollarSign className="w-4 h-4 lg:w-6 lg:h-6 text-white" />
                </div>
                <h1 className="text-sm sm:text-lg lg:text-2xl font-semibold text-[#0B3558] lg:hidden truncate min-w-0">
                  ExpenseTracker
                </h1>
                <h1 className="text-xl lg:text-2xl font-semibold text-[#0B3558] hidden lg:block truncate min-w-0">
                  Dashboard
                </h1>
              </div>
              <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
                {/* Global Search */}
                <div className="hidden sm:block">
                  <GlobalSearch />
                </div>

                {/* User Menu */}
                <div className="flex items-center space-x-1 sm:space-x-2">
                  <div className="hidden lg:flex items-center space-x-1 sm:space-x-2">
                    <div className="w-6 h-6 sm:w-8 sm:h-8 bg-[#006BFF]/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <User className="w-3 h-3 sm:w-4 sm:h-4 text-[#006BFF]" />
                    </div>
                    <span className="text-xs sm:text-sm font-medium text-[#0B3558] truncate max-w-20">
                      {session.user?.name}
                    </span>
                  </div>

                  <button
                    onClick={() => setShowSettingsModal(true)}
                    className="p-1.5 sm:p-2 text-[#476788] hover:text-[#0B3558] hover:bg-[#F8F9FB] rounded-lg transition-colors flex-shrink-0"
                    title="Settings"
                  >
                    <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>

                  {/* Make sign out button more prominent and always visible */}
                  <button
                    onClick={() => signOut({ callbackUrl: "/auth/signin" })}
                    className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors flex-shrink-0 inline-flex items-center space-x-1 shadow-sm"
                    title="Sign out"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Exit</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Navigation Tabs */}
        <div className="bg-white border-b border-[#E5E7EB] w-full overflow-x-hidden">
          <div className="w-full px-3 sm:px-4 lg:px-6 overflow-x-auto">
            <nav className="flex space-x-4 sm:space-x-6 lg:space-x-8 min-w-max">
              <button
                onClick={() => setActiveTab("overview")}
                className={`py-3 sm:py-4 px-1 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap ${
                  activeTab === "overview"
                    ? "border-[#006BFF] text-[#006BFF]"
                    : "border-transparent text-[#476788] hover:text-[#0B3558] hover:border-gray-300"
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab("financial")}
                className={`py-3 sm:py-4 px-1 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap ${
                  activeTab === "financial"
                    ? "border-[#006BFF] text-[#006BFF]"
                    : "border-transparent text-[#476788] hover:text-[#0B3558] hover:border-gray-300"
                }`}
              >
                Financial Dashboard
              </button>
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <main className="w-full px-2 sm:px-3 lg:px-4 py-3 sm:py-4 lg:py-6 overflow-x-hidden">
          {activeTab === "overview" ? (
            <>
              {/* Dashboard Stats */}
              <DashboardStats companies={companies} expenses={expenses} />

              {/* Quick Actions - Essential Only */}
              <div className="mt-3 sm:mt-4 lg:mt-6 flex flex-wrap gap-2 sm:gap-3 lg:gap-4 max-w-4xl">
                <button
                  onClick={() => setShowSimpleIncomeModal(true)}
                  className="card p-2 sm:p-3 lg:p-3 hover:shadow-lg transition-all cursor-pointer bg-green-50 hover:bg-green-100 border-green-200 w-48 sm:w-56 lg:w-64"
                >
                  <div className="flex items-center space-x-2 sm:space-x-3">
                    <div className="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 bg-green-600 rounded-lg flex items-center justify-center flex-shrink-0">
                      <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-xs sm:text-sm lg:text-base font-semibold text-green-800 truncate">
                        Add Income
                      </h3>
                      <p className="text-xs text-green-600 truncate hidden sm:block">
                        Track your earnings quickly
                      </p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => setShowExpenseModal(true)}
                  className="card p-2 sm:p-3 lg:p-3 hover:shadow-lg transition-all cursor-pointer bg-blue-50 hover:bg-blue-100 border-blue-200 w-48 sm:w-56 lg:w-64"
                >
                  <div className="flex items-center space-x-2 sm:space-x-3">
                    <div className="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                      <CreditCard className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-xs sm:text-sm lg:text-base font-semibold text-blue-800 truncate">
                        Add Expense
                      </h3>
                      <p className="text-xs text-blue-600 truncate hidden sm:block">
                        Track business expenses quickly
                      </p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => setShowReceiptScannerModal(true)}
                  className="card p-2 sm:p-3 lg:p-3 hover:shadow-lg transition-all cursor-pointer bg-purple-50 hover:bg-purple-100 border-purple-200 w-48 sm:w-56 lg:w-64"
                >
                  <div className="flex items-center space-x-2 sm:space-x-3">
                    <div className="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 bg-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Scan className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-xs sm:text-sm lg:text-base font-semibold text-purple-800 truncate">
                        Scan Receipt
                      </h3>
                      <p className="text-xs text-purple-600 truncate hidden sm:block">
                        Auto-extract expense from receipt
                      </p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => setShowSimpleDebtModal(true)}
                  className="card p-2 sm:p-3 lg:p-3 hover:shadow-lg transition-all cursor-pointer bg-orange-50 hover:bg-orange-100 border-orange-200 w-48 sm:w-56 lg:w-64"
                >
                  <div className="flex items-center space-x-2 sm:space-x-3">
                    <div className="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 bg-orange-600 rounded-lg flex items-center justify-center flex-shrink-0">
                      <AlertTriangle className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-xs sm:text-sm lg:text-base font-semibold text-orange-800 truncate">
                        Add Debt
                      </h3>
                      <p className="text-xs text-orange-600 truncate hidden sm:block">
                        Track and manage debts
                      </p>
                    </div>
                  </div>
                </button>
              </div>

              {/* Upcoming Subscriptions */}
              <div className="mt-3 sm:mt-4 lg:mt-6">
                <UpcomingSubscriptions
                  expenses={expenses}
                  onEdit={(expense) => {
                    setSelectedExpense(expense);
                    setShowExpenseModal(true);
                  }}
                  onViewDetails={(expenseId) => {
                    window.location.href = `/expenses/${expenseId}`;
                  }}
                  onCancel={(expenseId) => {
                    handleExpenseDeleted(expenseId);
                  }}
                />
              </div>

              {/* Companies and Expenses Grid */}
              <div className="mt-3 sm:mt-4 lg:mt-6 grid grid-cols-1 lg:grid-cols-2 gap-2 sm:gap-3 lg:gap-4 w-full">
                {/* Companies Section */}
                <div className="card p-2 sm:p-3 lg:p-4 w-full overflow-hidden">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2 sm:mb-3 lg:mb-4 gap-1 sm:gap-2 w-full">
                    <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
                      <Building2 className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-[#006BFF] flex-shrink-0" />
                      <h2 className="text-sm sm:text-base lg:text-lg font-semibold text-[#0B3558] truncate">
                        Companies
                      </h2>
                    </div>
                    <div className="flex items-center justify-between sm:space-x-3 flex-shrink-0">
                      <span className="bg-[#006BFF]/10 text-[#006BFF] text-xs font-medium px-2 py-1 rounded-full">
                        {companies.length}
                      </span>
                      <button
                        onClick={() => setShowCompanyModal(true)}
                        className="btn-primary text-xs px-2 py-1 inline-flex items-center space-x-1 ml-2"
                      >
                        <Plus className="w-3 h-3" />
                        <span className="hidden sm:inline">Add</span>
                      </button>
                    </div>
                  </div>

                  {companies.length === 0 ? (
                    <div className="text-center py-4 sm:py-6 lg:py-8">
                      <Building2 className="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 text-[#A6BBD1] mx-auto mb-2 sm:mb-3" />
                      <p className="text-xs sm:text-sm text-[#476788] mb-2 sm:mb-3">
                        No companies added yet
                      </p>
                      <button
                        onClick={() => setShowCompanyModal(true)}
                        className="btn-primary inline-flex items-center space-x-1 text-xs sm:text-sm"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Add Company</span>
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2 sm:space-y-3">
                      {companies.map((company) => (
                        <CompanyCard
                          key={company._id}
                          company={company}
                          onEdit={() => {
                            setSelectedCompany(company);
                            setShowCompanyModal(true);
                          }}
                          onDelete={() => handleCompanyDeleted(company._id)}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Expenses Section */}
                <div className="card p-2 sm:p-3 lg:p-4 w-full overflow-hidden">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2 sm:mb-3 lg:mb-4 gap-1 sm:gap-2 w-full">
                    <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
                      <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-[#006BFF] flex-shrink-0" />
                      <h2 className="text-sm sm:text-base lg:text-lg font-semibold text-[#0B3558] truncate">
                        Recent Expenses
                      </h2>
                    </div>
                    <div className="flex items-center justify-between sm:space-x-3 flex-shrink-0">
                      <span className="bg-[#006BFF]/10 text-[#006BFF] text-xs font-medium px-2 py-1 rounded-full">
                        {expenses.length}
                      </span>
                      <button
                        onClick={() => setShowExpenseModal(true)}
                        className="btn-primary text-xs px-2 py-1 inline-flex items-center space-x-1 ml-2"
                      >
                        <Plus className="w-3 h-3" />
                        <span className="hidden sm:inline">Add</span>
                      </button>
                    </div>
                  </div>

                  {expenses.length === 0 ? (
                    <div className="text-center py-4 sm:py-6 lg:py-8">
                      <CreditCard className="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 text-[#A6BBD1] mx-auto mb-2 sm:mb-3" />
                      <p className="text-xs sm:text-sm text-[#476788] mb-2 sm:mb-3">
                        No expenses tracked yet
                      </p>
                      <button
                        onClick={() => setShowExpenseModal(true)}
                        className="btn-primary inline-flex items-center space-x-1 text-xs sm:text-sm"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Add Expense</span>
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2 sm:space-y-3">
                      {expenses.slice(0, 5).map((expense) => (
                        <ExpenseCard
                          key={expense._id}
                          expense={expense}
                          onEdit={() => {
                            setSelectedExpense(expense);
                            setShowExpenseModal(true);
                          }}
                          onDelete={() => handleExpenseDeleted(expense._id)}
                        />
                      ))}
                      {expenses.length > 5 && (
                        <div className="text-center pt-3 sm:pt-4">
                          <button className="text-[#006BFF] hover:text-[#0052CC] text-xs sm:text-sm font-medium transition-colors">
                            View All Expenses →
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <FinancialDashboard
              onAddIncome={() => setShowSimpleIncomeModal(true)}
              onAddDebt={() => setShowSimpleDebtModal(true)}
            />
          )}
        </main>

        {/* Mobile Floating Action Button */}
        <div className="fixed bottom-4 right-4 sm:hidden z-40 max-w-[calc(100vw-2rem)]">
          <div className="relative">
            {showMobileMenu && (
              <div className="absolute bottom-14 right-0 space-y-2">
                <button
                  onClick={() => {
                    setShowReceiptScannerModal(true);
                    setShowMobileMenu(false);
                  }}
                  className="w-9 h-9 bg-purple-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-purple-700 transition-colors"
                  title="Scan Receipt"
                >
                  <Scan className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => {
                    setShowAssetModal(true);
                    setShowMobileMenu(false);
                  }}
                  className="w-9 h-9 bg-green-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-green-700 transition-colors"
                  title="Add Asset"
                >
                  <PiggyBank className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => {
                    setShowSimpleDebtModal(true);
                    setShowMobileMenu(false);
                  }}
                  className="w-9 h-9 bg-orange-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-orange-700 transition-colors"
                  title="Add Debt"
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => {
                    setShowSimpleIncomeModal(true);
                    setShowMobileMenu(false);
                  }}
                  className="w-9 h-9 bg-green-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-green-700 transition-colors"
                  title="Add Income"
                >
                  <TrendingUp className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => {
                    setShowPaymentMethodModal(true);
                    setShowMobileMenu(false);
                  }}
                  className="w-9 h-9 bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-blue-700 transition-colors"
                  title="Add Payment Method"
                >
                  <CreditCard className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => {
                    setShowExpenseModal(true);
                    setShowMobileMenu(false);
                  }}
                  className="w-9 h-9 bg-red-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-red-700 transition-colors"
                  title="Add Expense"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="w-11 h-11 bg-[#006BFF] text-white rounded-full shadow-lg flex items-center justify-center hover:bg-[#0052CC] transition-colors"
            >
              <Plus
                className={`w-4 h-4 transition-transform ${
                  showMobileMenu ? "rotate-45" : ""
                }`}
              />
            </button>
          </div>
        </div>

        {/* Modals */}
        {showCompanyModal && (
          <CompanyModal
            isOpen={showCompanyModal}
            onClose={() => {
              setShowCompanyModal(false);
              setSelectedCompany(null);
            }}
            company={selectedCompany}
            onSuccess={handleCompanyCreated}
          />
        )}

        {showExpenseModal && (
          <ExpenseModal
            isOpen={showExpenseModal}
            onClose={() => {
              setShowExpenseModal(false);
              setSelectedExpense(undefined);
            }}
            companies={companies}
            expense={selectedExpense}
            onSuccess={handleExpenseCreated}
          />
        )}

        {showPaymentMethodModal && (
          <PaymentMethodModal
            isOpen={showPaymentMethodModal}
            onClose={() => {
              setShowPaymentMethodModal(false);
              setSelectedPaymentMethod(null);
            }}
            paymentMethod={selectedPaymentMethod}
            onSuccess={
              selectedPaymentMethod
                ? handlePaymentMethodUpdated
                : handlePaymentMethodCreated
            }
          />
        )}

        {showIncomeModal && (
          <IncomeModal
            isOpen={showIncomeModal}
            onClose={() => {
              setShowIncomeModal(false);
              setSelectedIncome(null);
            }}
            income={selectedIncome}
            companies={companies}
            paymentMethods={paymentMethods}
            onSuccess={
              selectedIncome ? handleIncomeUpdated : handleIncomeCreated
            }
          />
        )}

        {showDebtModal && (
          <DebtModal
            isOpen={showDebtModal}
            onClose={() => {
              setShowDebtModal(false);
              setSelectedDebt(null);
            }}
            debt={selectedDebt}
            paymentMethods={paymentMethods}
            onSuccess={selectedDebt ? handleDebtUpdated : handleDebtCreated}
          />
        )}

        {showAssetModal && (
          <AssetModal
            isOpen={showAssetModal}
            onClose={() => {
              setShowAssetModal(false);
              setSelectedAsset(null);
            }}
            asset={selectedAsset}
            onSuccess={selectedAsset ? handleAssetUpdated : handleAssetCreated}
          />
        )}

        {showSettingsModal && (
          <SettingsModal
            isOpen={showSettingsModal}
            onClose={() => setShowSettingsModal(false)}
            userEmail={session?.user?.email || undefined}
            userName={session?.user?.name || undefined}
          />
        )}

        {showSimpleIncomeModal && (
          <SimpleIncomeModal
            isOpen={showSimpleIncomeModal}
            onClose={() => setShowSimpleIncomeModal(false)}
            onSuccess={handleIncomeCreated}
          />
        )}

        {showSimpleDebtModal && (
          <SimpleDebtModal
            isOpen={showSimpleDebtModal}
            onClose={() => setShowSimpleDebtModal(false)}
            onSuccess={handleDebtCreated}
          />
        )}

        {showReceiptScannerModal && (
          <ReceiptScannerModal
            isOpen={showReceiptScannerModal}
            onClose={() => setShowReceiptScannerModal(false)}
            onExpenseCreated={handleReceiptScanned}
          />
        )}

        {/* Notification Modal */}
        <NotificationModal
          isOpen={notification.isOpen}
          onClose={() => setNotification({ ...notification, isOpen: false })}
          type={notification.type}
          title={notification.title}
          message={notification.message}
        />
      </div>
    </div>
  );
}
