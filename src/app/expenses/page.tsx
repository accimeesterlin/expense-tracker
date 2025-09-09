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
import type { Company, Expense } from "@/types/shared";

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
      <div className="bg-white border-b border-[#E5E7EB] -m-4 sm:-m-6 mb-4 sm:mb-6">
        <div className="w-full px-4 sm:px-6 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <CreditCard className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-semibold text-[#0B3558]">
                  Expenses
                </h1>
                <p className="text-xs sm:text-sm text-[#476788]">
                  Track and manage all your business expenses
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowExpenseModal(true)}
              className="btn-primary inline-flex items-center space-x-2 text-sm sm:text-base w-full sm:w-auto justify-center"
            >
              <Plus className="w-4 h-4" />
              <span>Add Expense</span>
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-6 sm:space-y-8">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
          <div className="card p-3 sm:p-4 lg:p-6">
            <div className="flex items-center">
              <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-2 sm:mr-3 lg:mr-4">
                <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-blue-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-[#476788] truncate">
                  Total Expenses
                </p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-[#0B3558]">
                  {expenses.length}
                </p>
              </div>
            </div>
          </div>
          <div className="card p-3 sm:p-4 lg:p-6">
            <div className="flex items-center">
              <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-green-100 rounded-lg flex items-center justify-center mr-2 sm:mr-3 lg:mr-4">
                <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-green-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-[#476788] truncate">
                  Total Amount
                </p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-[#0B3558] truncate" title={formatCurrency(totalExpenseAmount)}>
                  {formatCurrency(totalExpenseAmount)}
                </p>
              </div>
            </div>
          </div>
          <div className="card p-3 sm:p-4 lg:p-6">
            <div className="flex items-center">
              <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-orange-100 rounded-lg flex items-center justify-center mr-2 sm:mr-3 lg:mr-4">
                <Calendar className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-orange-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-[#476788] truncate">
                  Active Expenses
                </p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-[#0B3558]">
                  {activeExpenses}
                </p>
              </div>
            </div>
          </div>
          <div className="card p-3 sm:p-4 lg:p-6 col-span-2 lg:col-span-1">
            <div className="flex items-center">
              <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-purple-100 rounded-lg flex items-center justify-center mr-2 sm:mr-3 lg:mr-4">
                <Building2 className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-purple-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-[#476788] truncate">
                  Monthly Recurring
                </p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-[#0B3558] truncate" title={formatCurrency(monthlyRecurring)}>
                  {formatCurrency(monthlyRecurring)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="card p-4 sm:p-6">
          <div className="grid grid-cols-1 gap-4">
            <div className="input-field-with-icon">
              <Search className="icon w-5 h-5" />
              <input
                type="text"
                placeholder="Search expenses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field w-full text-sm sm:text-base"
              />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="input-field text-sm sm:text-base"
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
                className="input-field text-sm sm:text-base"
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
                className="input-field text-sm sm:text-base col-span-2 sm:col-span-1"
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
                className="input-field text-sm sm:text-base col-span-2 sm:col-span-3 lg:col-span-1"
              >
                <option value="date">Sort by Date</option>
                <option value="amount">Sort by Amount</option>
                <option value="name">Sort by Name</option>
                <option value="company">Sort by Company</option>
                <option value="category">Sort by Category</option>
              </select>
            </div>
          </div>
        </div>

        {/* Expenses List */}
        {filteredExpenses.length === 0 ? (
          <div className="card p-8 sm:p-12 text-center">
            <CreditCard className="w-12 h-12 sm:w-16 sm:h-16 text-[#A6BBD1] mx-auto mb-4 sm:mb-8" />
            <h3 className="text-base sm:text-lg font-medium text-[#0B3558] mb-2">
              {expenses.length === 0
                ? "No expenses tracked yet"
                : "No expenses match your filters"}
            </h3>
            <p className="text-sm sm:text-base text-[#476788] mb-4 sm:mb-6">
              {expenses.length === 0
                ? "Start tracking your business expenses to get better insights"
                : "Try adjusting your search or filters"}
            </p>
            <button
              onClick={() => setShowExpenseModal(true)}
              className="btn-primary inline-flex items-center space-x-2 text-sm sm:text-base"
            >
              <Plus className="w-4 h-4" />
              <span>Add Your First Expense</span>
            </button>
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
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
