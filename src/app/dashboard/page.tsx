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

interface Company {
  _id: string;
  name: string;
  industry: string;
  description?: string;
  address: {
    street?: string;
    city: string;
    state: string;
    zipCode?: string;
  };
  contactInfo: {
    email: string;
    phone?: string;
    website?: string;
  };
  createdAt: string;
}

interface Expense {
  _id: string;
  name: string;
  description?: string;
  amount: number;
  category: string;
  tags?: string[];
  expenseType: string;
  frequency?: string;
  startDate?: string;
  nextBillingDate?: string;
  company: Company;
  isActive: boolean;
  receiptUrl?: string;
  receiptS3Key?: string;
  receiptFileName?: string;
  receiptContentType?: string;
  comments: Array<{
    text: string;
    createdAt: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

interface PaymentMethod {
  _id: string;
  name: string;
  type:
    | "credit_card"
    | "debit_card"
    | "bank_account"
    | "digital_wallet"
    | "other";
  provider?: string;
  lastFourDigits?: string;
  expiryDate?: string;
  isDefault: boolean;
  metadata?: {
    cardholderName?: string;
    bankName?: string;
  };
}

interface Income {
  _id: string;
  source: string;
  description?: string;
  amount: number;
  currency: string;
  frequency: string;
  category: string;
  paymentMethod?: PaymentMethod;
  company?: Company;
  receivedDate: string;
  nextPaymentDate?: string;
  isRecurring: boolean;
  isActive: boolean;
  tags: string[];
  notes?: string;
}

interface Debt {
  _id: string;
  name: string;
  description?: string;
  originalAmount: number;
  currentBalance: number;
  currency: string;
  type: string;
  interestRate?: number;
  minimumPayment: number;
  paymentFrequency: string;
  nextPaymentDate: string;
  paymentMethod?: PaymentMethod;
  creditor?: string;
  accountNumber?: string;
  isActive: boolean;
  tags: string[];
  notes?: string;
}

interface Asset {
  _id: string;
  name: string;
  description?: string;
  type: string;
  category: string;
  currentValue: number;
  currency: string;
  purchaseDate?: string;
  purchasePrice?: number;
  appreciationRate?: number;
  isLiquid: boolean;
  location?: string;
  metadata?: {
    institution?: string;
    make?: string;
    model?: string;
    year?: number;
    address?: string;
  };
  isActive: boolean;
  tags: string[];
  notes?: string;
}

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
    if (!confirm("Are you sure you want to delete this expense?")) {
      return;
    }

    try {
      const response = await fetch(`/api/expenses/${expenseId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setExpenses((prev) => prev.filter((e) => e._id !== expenseId));
      } else {
        const errorData = await response.json();
        alert(errorData.error || "Failed to delete expense");
      }
    } catch (error) {
      console.error("Error deleting expense:", error);
      alert("Failed to delete expense. Please try again.");
    }
  };

  const handlePaymentMethodCreated = (newPaymentMethod: PaymentMethod) => {
    setShowPaymentMethodModal(false);
    setSelectedPaymentMethod(null);
  };

  const handlePaymentMethodUpdated = (updatedPaymentMethod: PaymentMethod) => {
    setShowPaymentMethodModal(false);
    setSelectedPaymentMethod(null);
  };

  const handleIncomeCreated = (newIncome: Income) => {
    setShowIncomeModal(false);
    setSelectedIncome(null);
  };

  const handleIncomeUpdated = (updatedIncome: Income) => {
    setShowIncomeModal(false);
    setSelectedIncome(null);
  };

  const handleDebtCreated = (newDebt: Debt) => {
    setShowDebtModal(false);
    setSelectedDebt(null);
  };

  const handleDebtUpdated = (updatedDebt: Debt) => {
    setShowDebtModal(false);
    setSelectedDebt(null);
  };

  const handleAssetCreated = (newAsset: Asset) => {
    setShowAssetModal(false);
    setSelectedAsset(null);
  };

  const handleAssetUpdated = (updatedAsset: Asset) => {
    setShowAssetModal(false);
    setSelectedAsset(null);
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
    <div className="min-h-screen bg-[#F8F9FB] flex">
      {/* Sidebar */}
      <Sidebar isOpen={showSidebar} onClose={() => setShowSidebar(false)} />

      {/* Main content area */}
      <div className="flex-1 lg:ml-0">
        {/* Header */}
        <header className="bg-white border-b border-[#E5E7EB]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setShowSidebar(true)}
                  className="p-2 text-[#476788] hover:text-[#0B3558] hover:bg-[#F8F9FB] rounded-lg transition-colors lg:hidden"
                >
                  <Menu className="w-5 h-5" />
                </button>
                <div className="w-10 h-10 bg-[#006BFF] rounded-xl flex items-center justify-center lg:hidden">
                  <DollarSign className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-2xl font-semibold text-[#0B3558] lg:hidden">
                  ExpenseTracker
                </h1>
                <h1 className="text-2xl font-semibold text-[#0B3558] hidden lg:block">
                  Dashboard
                </h1>
              </div>
              <div className="flex items-center space-x-4">
                {/* Global Search */}
                <GlobalSearch />

                {/* User Menu */}
                <div className="flex items-center space-x-3">
                  <div className="hidden sm:flex items-center space-x-3">
                    <div className="w-8 h-8 bg-[#006BFF]/10 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-[#006BFF]" />
                    </div>
                    <span className="text-sm font-medium text-[#0B3558]">
                      {session.user?.name}
                    </span>
                  </div>

                  <button
                    onClick={() => setShowSettingsModal(true)}
                    className="p-2 text-[#476788] hover:text-[#0B3558] hover:bg-[#F8F9FB] rounded-lg transition-colors"
                    title="Settings"
                  >
                    <Settings className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => signOut({ callbackUrl: "/auth/signin" })}
                    className="p-2 text-[#476788] hover:text-[#0B3558] hover:bg-[#F8F9FB] rounded-lg transition-colors"
                    title="Sign out"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Navigation Tabs */}
        <div className="bg-white border-b border-[#E5E7EB]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <nav className="flex space-x-8">
              <button
                onClick={() => setActiveTab("overview")}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "overview"
                    ? "border-[#006BFF] text-[#006BFF]"
                    : "border-transparent text-[#476788] hover:text-[#0B3558] hover:border-gray-300"
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab("financial")}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
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
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {activeTab === "overview" ? (
            <>
              {/* Dashboard Stats */}
              <DashboardStats companies={companies} expenses={expenses} />

              {/* Quick Actions - Essential Only */}
              <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                <button
                  onClick={() => setShowSimpleIncomeModal(true)}
                  className="card p-6 hover:shadow-lg transition-all cursor-pointer bg-green-50 hover:bg-green-100 border-green-200"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-green-800">
                        Add Income
                      </h3>
                      <p className="text-sm text-green-600">
                        Track your earnings quickly
                      </p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => setShowExpenseModal(true)}
                  className="card p-6 hover:shadow-lg transition-all cursor-pointer bg-blue-50 hover:bg-blue-100 border-blue-200"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
                      <CreditCard className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-blue-800">
                        Add Expense
                      </h3>
                      <p className="text-sm text-blue-600">
                        Track business expenses quickly
                      </p>
                    </div>
                  </div>
                </button>
              </div>

              {/* Upcoming Subscriptions */}
              <div className="mt-8">
                <UpcomingSubscriptions expenses={expenses} />
              </div>

              {/* Companies and Expenses Grid */}
              <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Companies Section */}
                <div className="card p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-3">
                      <Building2 className="w-6 h-6 text-[#006BFF]" />
                      <h2 className="text-xl font-semibold text-[#0B3558]">
                        Companies
                      </h2>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="bg-[#006BFF]/10 text-[#006BFF] text-xs font-medium px-2.5 py-1 rounded-full">
                        {companies.length}
                      </span>
                      <button
                        onClick={() => setShowCompanyModal(true)}
                        className="btn-primary text-xs px-3 py-1.5 inline-flex items-center space-x-1"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Add</span>
                      </button>
                    </div>
                  </div>

                  {companies.length === 0 ? (
                    <div className="text-center py-12">
                      <Building2 className="w-12 h-12 text-[#A6BBD1] mx-auto mb-4" />
                      <p className="text-[#476788] mb-4">
                        No companies added yet
                      </p>
                      <button
                        onClick={() => setShowCompanyModal(true)}
                        className="btn-primary inline-flex items-center space-x-2"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Add Your First Company</span>
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
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
                <div className="card p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-3">
                      <CreditCard className="w-6 h-6 text-[#006BFF]" />
                      <h2 className="text-xl font-semibold text-[#0B3558]">
                        Recent Expenses
                      </h2>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="bg-[#006BFF]/10 text-[#006BFF] text-xs font-medium px-2.5 py-1 rounded-full">
                        {expenses.length}
                      </span>
                      <button
                        onClick={() => setShowExpenseModal(true)}
                        className="btn-primary text-xs px-3 py-1.5 inline-flex items-center space-x-1"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Add</span>
                      </button>
                    </div>
                  </div>

                  {expenses.length === 0 ? (
                    <div className="text-center py-12">
                      <CreditCard className="w-12 h-12 text-[#A6BBD1] mx-auto mb-4" />
                      <p className="text-[#476788] mb-4">
                        No expenses tracked yet
                      </p>
                      <button
                        onClick={() => setShowExpenseModal(true)}
                        className="btn-primary inline-flex items-center space-x-2"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Add Your First Expense</span>
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
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
                        <div className="text-center pt-4">
                          <button className="text-[#006BFF] hover:text-[#0052CC] text-sm font-medium transition-colors">
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
        <div className="fixed bottom-6 right-6 sm:hidden z-40">
          <div className="relative">
            {showMobileMenu && (
              <div className="absolute bottom-16 right-0 space-y-3">
                <button
                  onClick={() => {
                    setShowAssetModal(true);
                    setShowMobileMenu(false);
                  }}
                  className="w-10 h-10 bg-green-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-green-700 transition-colors"
                  title="Add Asset"
                >
                  <PiggyBank className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    setShowSimpleDebtModal(true);
                    setShowMobileMenu(false);
                  }}
                  className="w-10 h-10 bg-orange-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-orange-700 transition-colors"
                  title="Add Debt"
                >
                  <AlertTriangle className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    setShowSimpleIncomeModal(true);
                    setShowMobileMenu(false);
                  }}
                  className="w-10 h-10 bg-green-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-green-700 transition-colors"
                  title="Add Income"
                >
                  <TrendingUp className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    setShowPaymentMethodModal(true);
                    setShowMobileMenu(false);
                  }}
                  className="w-10 h-10 bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-blue-700 transition-colors"
                  title="Add Payment Method"
                >
                  <CreditCard className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    setShowExpenseModal(true);
                    setShowMobileMenu(false);
                  }}
                  className="w-10 h-10 bg-red-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-red-700 transition-colors"
                  title="Add Expense"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            )}
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="w-12 h-12 bg-[#006BFF] text-white rounded-full shadow-lg flex items-center justify-center hover:bg-[#0052CC] transition-colors"
            >
              <Plus
                className={`w-5 h-5 transition-transform ${
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
      </div>
    </div>
  );
}
