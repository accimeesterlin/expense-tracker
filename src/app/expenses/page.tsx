"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  CreditCard,
  Plus,
  Search,
  Calendar,
  DollarSign,
  Building2,
} from "lucide-react";
import AppLayout from "@/components/AppLayout";
import ExpenseModal from "@/components/ExpenseModal";
import ExpenseCard from "@/components/ExpenseCard";

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

export default function ExpensesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [filteredExpenses, setFilteredExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedCompany, setSelectedCompany] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("date");
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | undefined>(
    undefined
  );

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
      const [expensesRes, companiesRes] = await Promise.all([
        fetch("/api/expenses"),
        fetch("/api/companies"),
      ]);

      if (expensesRes.ok) {
        const expensesData = await expensesRes.json();
        setExpenses(expensesData);
      }

      if (companiesRes.ok) {
        const companiesData = await companiesRes.json();
        setCompanies(companiesData);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortExpenses = useCallback(() => {
    const filtered = expenses.filter((expense) => {
      const matchesSearch =
        expense.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        expense.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        expense.company.name.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory =
        selectedCategory === "all" || expense.category === selectedCategory;
      const matchesType =
        selectedType === "all" || expense.expenseType === selectedType;
      const matchesCompany =
        selectedCompany === "all" || expense.company._id === selectedCompany;

      return matchesSearch && matchesCategory && matchesType && matchesCompany;
    });

    // Sort expenses
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "amount":
          return b.amount - a.amount;
        case "name":
          return a.name.localeCompare(b.name);
        case "company":
          return a.company.name.localeCompare(b.company.name);
        case "category":
          return a.category.localeCompare(b.category);
        case "date":
        default:
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
      }
    });

    setFilteredExpenses(filtered);
  }, [expenses, searchTerm, selectedCategory, selectedType, selectedCompany, sortBy]);

  useEffect(() => {
    filterAndSortExpenses();
  }, [filterAndSortExpenses]);

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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const getUniqueCategories = () => {
    const categories = [
      ...new Set(expenses.map((expense) => expense.category)),
    ];
    return categories.sort();
  };

  const getUniqueTypes = () => {
    const types = [...new Set(expenses.map((expense) => expense.expenseType))];
    return types.sort();
  };

  const totalExpenseAmount = expenses.reduce(
    (sum, expense) => sum + expense.amount,
    0
  );
  const activeExpenses = expenses.filter((e) => e.isActive).length;
  const monthlySubscriptions = expenses.filter(
    (e) => e.expenseType === "subscription" && e.isActive
  );
  const monthlyRecurring = monthlySubscriptions.reduce(
    (sum, e) => sum + e.amount,
    0
  );

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-[#F8F9FB] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#006BFF]"></div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <AppLayout title="Expenses">
      {/* Page Header */}
      <div className="bg-white border-b border-[#E5E7EB] -m-6 mb-6">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-[#0B3558]">
                  Expenses
                </h1>
                <p className="text-sm text-[#476788]">
                  Track and manage all your business expenses
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowExpenseModal(true)}
              className="btn-primary inline-flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add Expense</span>
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="card p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                <CreditCard className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-[#476788]">
                  Total Expenses
                </p>
                <p className="text-2xl font-bold text-[#0B3558]">
                  {expenses.length}
                </p>
              </div>
            </div>
          </div>
          <div className="card p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-[#476788]">
                  Total Amount
                </p>
                <p className="text-2xl font-bold text-[#0B3558]">
                  {formatCurrency(totalExpenseAmount)}
                </p>
              </div>
            </div>
          </div>
          <div className="card p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mr-4">
                <Calendar className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-[#476788]">
                  Active Expenses
                </p>
                <p className="text-2xl font-bold text-[#0B3558]">
                  {activeExpenses}
                </p>
              </div>
            </div>
          </div>
          <div className="card p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mr-4">
                <Building2 className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-[#476788]">
                  Monthly Recurring
                </p>
                <p className="text-2xl font-bold text-[#0B3558]">
                  {formatCurrency(monthlyRecurring)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="card p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
            <div className="lg:col-span-2">
              <div className="relative">
                <Search className="w-5 h-5 text-[#476788] absolute left-4 top-1/2 transform -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search expenses..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input-field pl-12 w-full"
                />
              </div>
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="input-field"
            >
              <option value="all">All Categories</option>
              {getUniqueCategories().map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="input-field"
            >
              <option value="all">All Types</option>
              {getUniqueTypes().map((type) => (
                <option key={type} value={type}>
                  {type.replace("-", " ").toUpperCase()}
                </option>
              ))}
            </select>
            <select
              value={selectedCompany}
              onChange={(e) => setSelectedCompany(e.target.value)}
              className="input-field"
            >
              <option value="all">All Companies</option>
              {companies.map((company) => (
                <option key={company._id} value={company._id}>
                  {company.name}
                </option>
              ))}
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="input-field"
            >
              <option value="date">Sort by Date</option>
              <option value="amount">Sort by Amount</option>
              <option value="name">Sort by Name</option>
              <option value="company">Sort by Company</option>
              <option value="category">Sort by Category</option>
            </select>
          </div>
        </div>

        {/* Expenses List */}
        {filteredExpenses.length === 0 ? (
          <div className="card p-12 text-center">
            <CreditCard className="w-16 h-16 text-[#A6BBD1] mx-auto mb-8" />
            <h3 className="text-lg font-medium text-[#0B3558] mb-2">
              {expenses.length === 0
                ? "No expenses tracked yet"
                : "No expenses match your filters"}
            </h3>
            <p className="text-[#476788] mb-6">
              {expenses.length === 0
                ? "Start tracking your business expenses to get better insights"
                : "Try adjusting your search or filters"}
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
            {filteredExpenses.map((expense) => (
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
          </div>
        )}
      </div>

      {/* Modal */}
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
    </AppLayout>
  );
}
