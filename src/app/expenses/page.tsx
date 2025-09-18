"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  CreditCard,
  Plus,
  Search,
  Calendar,
  DollarSign,
  Building2,
  Filter,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import AppLayout from "@/components/AppLayout";
import ExpenseModal from "@/components/ExpenseModal";
import ExpenseCard from "@/components/ExpenseCard";
import NotificationModal from "@/components/NotificationModal";
import type { Company, Expense } from "@/types/shared";

function ExpensesPageContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [budgets, setBudgets] = useState<Array<{ _id: string; name: string; totalAmount: number }>>([]);
  const [filteredExpenses, setFilteredExpenses] = useState<Expense[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [dateFilter, setDateFilter] = useState<{startDate?: string; endDate?: string}>({});
  const [sortBy, setSortBy] = useState<string>("date");
  const [showFilters, setShowFilters] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | undefined>(
    undefined
  );
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

  // Add focus/visibility event listeners for iPhone Chrome
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && session) {
        // Page became visible, refetch data
        fetchData();
      }
    };

    const handleFocus = () => {
      if (session) {
        fetchData();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [session]);

  useEffect(() => {
    // Set initial filters from URL parameters
    const categoryParam = searchParams.get("category");
    const tagParam = searchParams.get("tag");
    const companyParam = searchParams.get("company");
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");

    if (categoryParam) {
      setSelectedCategories([categoryParam]);
    }
    if (tagParam) {
      setSelectedTags([tagParam]);
    }
    if (companyParam) {
      setSelectedCompanies([companyParam]);
    }
    if (startDateParam || endDateParam) {
      setDateFilter({
        startDate: startDateParam || undefined,
        endDate: endDateParam || undefined
      });
      setShowFilters(true); // Show filters when date filtering is applied
    }
  }, [searchParams]);

  const fetchData = async () => {
    try {
      // Add cache-busting for iPhone Chrome and aggressive caching prevention
      const cacheHeaders = {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      };
      
      const [expensesRes, companiesRes, categoriesRes, tagsRes, budgetsRes] =
        await Promise.all([
          fetch("/api/expenses", { 
            headers: cacheHeaders,
            cache: 'no-store' 
          }),
          fetch("/api/companies", { 
            headers: cacheHeaders,
            cache: 'no-store' 
          }),
          fetch("/api/categories", { 
            headers: cacheHeaders,
            cache: 'no-store' 
          }),
          fetch("/api/tags", { 
            headers: cacheHeaders,
            cache: 'no-store' 
          }),
          fetch("/api/budgets", { 
            headers: cacheHeaders,
            cache: 'no-store' 
          }),
        ]);

      if (expensesRes.ok) {
        const expensesData = await expensesRes.json();
        setExpenses(expensesData);
      }

      if (companiesRes.ok) {
        const companiesData = await companiesRes.json();
        setCompanies(companiesData);
      }

      if (categoriesRes.ok) {
        const categoriesData = await categoriesRes.json();
        setCategories(
          Array.isArray(categoriesData)
            ? categoriesData.map((cat: { name: string }) => cat.name)
            : []
        );
      }

      if (tagsRes.ok) {
        const tagsData = await tagsRes.json();
        setTags(
          Array.isArray(tagsData)
            ? tagsData.map((tag: { name: string }) => tag.name)
            : []
        );
      }

      if (budgetsRes.ok) {
        const budgetsData = await budgetsRes.json();
        setBudgets(
          Array.isArray(budgetsData)
            ? budgetsData.map((budget: any) => ({
                _id: budget._id,
                name: budget.name,
                totalAmount: budget.totalAmount
              }))
            : []
        );
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
        selectedCategories.length === 0 ||
        selectedCategories.includes(expense.category);
      const matchesType =
        selectedTypes.length === 0 ||
        selectedTypes.includes(expense.expenseType);
      const matchesCompany =
        selectedCompanies.length === 0 ||
        selectedCompanies.includes(expense.company._id);
      const matchesTag =
        selectedTags.length === 0 ||
        (expense.tags &&
          expense.tags.some((tag) => selectedTags.includes(tag)));
      
      // Date filtering
      const matchesDate = (() => {
        if (!dateFilter.startDate && !dateFilter.endDate) return true;
        
        const expenseDate = new Date(expense.paymentDate || expense.createdAt);
        const startDate = dateFilter.startDate ? new Date(dateFilter.startDate) : null;
        const endDate = dateFilter.endDate ? new Date(dateFilter.endDate) : null;
        
        if (startDate && expenseDate < startDate) return false;
        if (endDate && expenseDate >= endDate) return false;
        return true;
      })();

      return (
        matchesSearch &&
        matchesCategory &&
        matchesType &&
        matchesCompany &&
        matchesTag &&
        matchesDate
      );
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
  }, [
    expenses,
    searchTerm,
    selectedCategories,
    selectedTypes,
    selectedCompanies,
    selectedTags,
    dateFilter,
    sortBy,
  ]);

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

  const handleQuickUpdate = async (
    expenseId: string,
    field: string,
    value: any
  ) => {
    try {
      const response = await fetch(`/api/expenses/${expenseId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ [field]: value }),
      });

      if (response.ok) {
        const updatedExpense = await response.json();
        setExpenses((prev) =>
          prev.map((e) => (e._id === expenseId ? updatedExpense : e))
        );

        // Sync budgets if budget field was updated
        if (field === "budget") {
          try {
            await fetch("/api/budgets/sync", { method: "POST" });
          } catch (error) {
            console.error("Failed to sync budgets:", error);
          }
        }

        // Don't show notifications for quick edits to reduce noise
      } else {
        const errorData = await response.json();
        setNotification({
          isOpen: true,
          type: "error",
          title: "Update Failed",
          message: errorData.error || "Failed to update expense",
        });
      }
    } catch (error) {
      console.error("Error updating expense:", error);
      setNotification({
        isOpen: true,
        type: "error",
        title: "Update Failed",
        message: "Failed to update expense. Please try again.",
      });
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const getUniqueCategories = () => {
    // Use database categories if available
    if (categories.length > 0) {
      // Combine database categories with categories from existing expenses
      const expenseCategories = expenses
        .map((expense) => expense.category)
        .filter((category) => category && category.trim() !== "");

      const allCategories = [...new Set([...categories, ...expenseCategories])];
      return allCategories.sort();
    }

    // Fallback to default categories if no database categories exist
    const defaultCategories = [
      "Software & Subscriptions",
      "Office & Supplies",
      "Travel & Entertainment",
      "Marketing & Advertising",
      "Professional Services",
      "Insurance",
      "Utilities",
      "Rent & Leasing",
      "Equipment",
      "Other",
    ];

    // Get categories from existing expenses
    const expenseCategories = expenses
      .map((expense) => expense.category)
      .filter((category) => category && category.trim() !== "");

    // Combine and deduplicate
    const allCategories = [
      ...new Set([...defaultCategories, ...expenseCategories]),
    ];
    return allCategories.sort();
  };

  const getUniqueTypes = () => {
    const types = [...new Set(expenses.map((expense) => expense.expenseType))];
    return types.sort();
  };

  const getUniqueTags = () => {
    // Use database tags if available
    if (tags.length > 0) {
      // Combine database tags with tags from existing expenses
      const expenseTags = expenses
        .flatMap((expense) => expense.tags || [])
        .filter((tag) => tag && tag.trim() !== "");

      const allTags = [...new Set([...tags, ...expenseTags])];
      return allTags.sort();
    }

    // Fallback to expense tags only
    const expenseTags = expenses
      .flatMap((expense) => expense.tags || [])
      .filter((tag) => tag && tag.trim() !== "");
    return [...new Set(expenseTags)].sort();
  };

  const totalExpenseAmount = expenses.reduce(
    (sum, expense) => sum + expense.amount,
    0
  );

  // Helper functions for multi-select
  const toggleCategory = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  };

  const toggleType = (type: string) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const toggleCompany = (companyId: string) => {
    setSelectedCompanies((prev) =>
      prev.includes(companyId)
        ? prev.filter((c) => c !== companyId)
        : [...prev, companyId]
    );
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const clearAllFilters = () => {
    setSelectedCategories([]);
    setSelectedTypes([]);
    setSelectedCompanies([]);
    setSelectedTags([]);
    setDateFilter({});
    setCurrentPage(1); // Reset to first page when clearing filters
  };

  // Calculate pagination
  const totalItems = filteredExpenses.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedExpenses = filteredExpenses.slice(startIndex, endIndex);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filteredExpenses]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };
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
              className="btn-primary inline-flex items-center space-x-2 text-sm sm:text-base w-auto justify-center"
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
                <p
                  className="text-lg sm:text-xl lg:text-2xl font-bold text-[#0B3558] truncate"
                  title={formatCurrency(totalExpenseAmount)}
                >
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
                <p
                  className="text-lg sm:text-xl lg:text-2xl font-bold text-[#0B3558] truncate"
                  title={formatCurrency(monthlyRecurring)}
                >
                  {formatCurrency(monthlyRecurring)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter Toggle */}
        <div className="card p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-start sm:items-center">
            <div className="flex-1 input-field-with-icon">
              <Search className="icon w-5 h-5" />
              <input
                type="text"
                placeholder="Search expenses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field w-full text-sm sm:text-base"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`inline-flex items-center space-x-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors relative ${
                selectedCategories.length > 0 ||
                selectedTypes.length > 0 ||
                selectedCompanies.length > 0 ||
                selectedTags.length > 0
                  ? "text-[#006BFF] bg-blue-50 hover:bg-blue-100"
                  : "text-[#476788] hover:text-[#0B3558] hover:bg-[#F8F9FB]"
              }`}
            >
              <Filter className="w-4 h-4" />
              <span>Filters</span>
              {(selectedCategories.length > 0 ||
                selectedTypes.length > 0 ||
                selectedCompanies.length > 0 ||
                selectedTags.length > 0) && (
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-[#006BFF] rounded-full"></span>
              )}
              {showFilters ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
          </div>

          {showFilters && (
            <div className="mt-4 pt-4 border-t border-[#E5E7EB]">
              {/* Active Filters */}
              {(selectedCategories.length > 0 ||
                selectedTypes.length > 0 ||
                selectedCompanies.length > 0 ||
                selectedTags.length > 0) && (
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  <span className="text-sm font-medium text-[#476788]">
                    Active filters:
                  </span>
                  {selectedCategories.map((category) => (
                    <span
                      key={category}
                      className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                    >
                      {category}
                      <button
                        onClick={() => toggleCategory(category)}
                        className="ml-1 hover:text-blue-900"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  {selectedTypes.map((type) => (
                    <span
                      key={type}
                      className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full"
                    >
                      {type}
                      <button
                        onClick={() => toggleType(type)}
                        className="ml-1 hover:text-green-900"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  {selectedCompanies.map((companyId) => {
                    const company = companies.find((c) => c._id === companyId);
                    return company ? (
                      <span
                        key={companyId}
                        className="inline-flex items-center px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full"
                      >
                        {company.name}
                        <button
                          onClick={() => toggleCompany(companyId)}
                          className="ml-1 hover:text-purple-900"
                        >
                          ×
                        </button>
                      </span>
                    ) : null;
                  })}
                  {selectedTags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full"
                    >
                      {tag}
                      <button
                        onClick={() => toggleTag(tag)}
                        className="ml-1 hover:text-orange-900"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  <button
                    onClick={clearAllFilters}
                    className="text-xs text-red-600 hover:text-red-800 font-medium"
                  >
                    Clear all
                  </button>
                </div>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#476788] mb-1">
                    Categories
                  </label>
                  <div className="max-h-24 overflow-y-auto border border-[#E5E7EB] rounded-lg p-2 bg-white">
                    {getUniqueCategories().map((category) => (
                      <label
                        key={category}
                        className="flex items-center text-xs py-1 hover:bg-gray-50 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedCategories.includes(category)}
                          onChange={() => toggleCategory(category)}
                          className="mr-2 text-blue-600"
                        />
                        {category}
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#476788] mb-1">
                    Types
                  </label>
                  <div className="max-h-24 overflow-y-auto border border-[#E5E7EB] rounded-lg p-2 bg-white">
                    {getUniqueTypes().map((type) => (
                      <label
                        key={type}
                        className="flex items-center text-xs py-1 hover:bg-gray-50 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedTypes.includes(type)}
                          onChange={() => toggleType(type)}
                          className="mr-2 text-blue-600"
                        />
                        {type.replace("-", " ").toUpperCase()}
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#476788] mb-1">
                    Companies
                  </label>
                  <div className="max-h-24 overflow-y-auto border border-[#E5E7EB] rounded-lg p-2 bg-white">
                    {companies.map((company) => (
                      <label
                        key={company._id}
                        className="flex items-center text-xs py-1 hover:bg-gray-50 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedCompanies.includes(company._id)}
                          onChange={() => toggleCompany(company._id)}
                          className="mr-2 text-blue-600"
                        />
                        {company.name}
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#476788] mb-1">
                    Tags
                  </label>
                  <div className="max-h-24 overflow-y-auto border border-[#E5E7EB] rounded-lg p-2 bg-white">
                    {getUniqueTags().map((tag) => (
                      <label
                        key={tag}
                        className="flex items-center text-xs py-1 hover:bg-gray-50 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedTags.includes(tag)}
                          onChange={() => toggleTag(tag)}
                          className="mr-2 text-blue-600"
                        />
                        {tag}
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#476788] mb-1">
                    Sort
                  </label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="input-field text-sm sm:text-base w-full"
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
          )}
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
            {paginatedExpenses.map((expense) => (
              <ExpenseCard
                key={expense._id}
                expense={expense}
                onEdit={() => {
                  setSelectedExpense(expense);
                  setShowExpenseModal(true);
                }}
                onDelete={() => handleExpenseDeleted(expense._id)}
                onQuickUpdate={handleQuickUpdate}
                availableCategories={
                  categories.length > 0 ? categories : getUniqueCategories()
                }
                availableTags={tags}
                availableBudgets={budgets}
                availableCompanies={companies}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {filteredExpenses.length > 0 && (
          <div className="card p-4 sm:p-6 mt-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <label className="text-sm font-medium text-[#476788]">Show:</label>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => handleItemsPerPageChange(parseInt(e.target.value))}
                    className="input-field text-sm py-1 px-2"
                  >
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                  <span className="text-sm text-[#476788]">per page</span>
                </div>
                <div className="text-sm text-[#476788]">
                  Showing {startIndex + 1}-{Math.min(endIndex, totalItems)} of {totalItems} expenses
                </div>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="btn-secondary text-sm px-3 py-1 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  
                  <div className="flex items-center space-x-1">
                    {/* Show page numbers */}
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      
                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`w-8 h-8 text-sm rounded ${
                            currentPage === pageNum
                              ? 'bg-[#006BFF] text-white'
                              : 'bg-white text-[#476788] hover:bg-[#F8F9FB] border border-[#E5E7EB]'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="btn-secondary text-sm px-3 py-1 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
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

      {/* Notification Modal */}
      <NotificationModal
        isOpen={notification.isOpen}
        onClose={() => setNotification({ ...notification, isOpen: false })}
        type={notification.type}
        title={notification.title}
        message={notification.message}
      />
    </AppLayout>
  );
}

export default function ExpensesPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F8F9FB] flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#006BFF]"></div>
        </div>
      }
    >
      <ExpensesPageContent />
    </Suspense>
  );
}
