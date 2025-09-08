"use client";

import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Search,
  ArrowLeft,
  Filter,
  Building2,
  Calendar,
  Tag,
  Loader2,
} from "lucide-react";
import Link from "next/link";

interface SearchResult {
  expenses: Array<{
    _id: string;
    name: string;
    description?: string;
    amount: number;
    category: string;
    expenseType: string;
    company: {
      _id: string;
      name: string;
      industry?: string;
    };
    createdAt: string;
    tags?: string[];
  }>;
  companies: Array<{
    _id: string;
    name: string;
    industry?: string;
    address?: {
      city: string;
      state: string;
    };
    contactInfo?: {
      email: string;
    };
  }>;
  total: number;
  metadata: {
    query: string;
    filters: {
      startDate?: string;
      endDate?: string;
      category?: string;
      company?: string;
    };
    pagination: {
      limit: number;
      offset: number;
      hasMore: boolean;
    };
  };
}

function SearchPageContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [results, setResults] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    category: "",
    expenseType: "",
    minAmount: "",
    maxAmount: "",
    startDate: "",
    endDate: "",
  });
  const searchTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  const categories = [
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

  const expenseTypes = [
    { value: "one-time", label: "One-time" },
    { value: "subscription", label: "Subscription" },
    { value: "recurring", label: "Recurring" },
  ];

  const performSearch = useCallback(async (
    query: string,
    currentFilters: typeof filters
  ) => {
    if (!query.trim() && !Object.values(currentFilters).some((v) => v)) {
      setResults(null);
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (query.trim()) params.set("q", query);
      Object.entries(currentFilters).forEach(([key, value]) => {
        if (value) params.set(key, value);
      });

      const response = await fetch(`/api/search?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setResults(data);
      }
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated") {
      router.push("/auth/signin");
      return;
    }

    // Initialize search from URL params
    const initialQuery = searchParams.get("q") || "";
    if (initialQuery) {
      setSearchQuery(initialQuery);
      performSearch(initialQuery, filters);
    }
  }, [status, router, searchParams, performSearch, filters]);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Debounce search
    searchTimeoutRef.current = setTimeout(() => {
      performSearch(value, filters);

      // Update URL
      const params = new URLSearchParams();
      if (value.trim()) params.set("q", value);
      router.replace(`/search?${params.toString()}`, { scroll: false });
    }, 300);
  };

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    performSearch(searchQuery, newFilters);
  };

  const clearFilters = () => {
    const clearedFilters = {
      category: "",
      expenseType: "",
      minAmount: "",
      maxAmount: "",
      startDate: "",
      endDate: "",
    };
    setFilters(clearedFilters);
    performSearch(searchQuery, clearedFilters);
  };

  const hasActiveFilters = Object.values(filters).some((v) => v);

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

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-[#F8F9FB] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#006BFF]"></div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#F8F9FB]">
      {/* Header */}
      <div className="bg-white border-b border-[#E5E7EB]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link
                href="/"
                className="p-2 rounded-lg hover:bg-[#F8F9FB] transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-[#476788]" />
              </Link>
              <div className="flex items-center space-x-3">
                <Search className="w-6 h-6 text-[#006BFF]" />
                <h1 className="text-2xl font-semibold text-[#0B3558]">
                  Search
                </h1>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#476788]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search expenses, companies, categories..."
              className="w-full pl-12 pr-12 py-3 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#006BFF]/20 focus:border-[#006BFF]"
            />
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded transition-colors ${
                showFilters || hasActiveFilters
                  ? "text-[#006BFF] bg-[#006BFF]/10"
                  : "text-[#476788] hover:text-[#006BFF]"
              }`}
            >
              <Filter className="w-5 h-5" />
            </button>
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="mt-4 p-4 bg-white border border-[#E5E7EB] rounded-lg">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-[#0B3558]">Filters</h3>
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="text-sm text-[#006BFF] hover:text-[#0052CC]"
                  >
                    Clear all
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#476788] mb-1">
                    Category
                  </label>
                  <select
                    value={filters.category}
                    onChange={(e) =>
                      handleFilterChange("category", e.target.value)
                    }
                    className="input-field w-full"
                  >
                    <option value="">All Categories</option>
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#476788] mb-1">
                    Type
                  </label>
                  <select
                    value={filters.expenseType}
                    onChange={(e) =>
                      handleFilterChange("expenseType", e.target.value)
                    }
                    className="input-field w-full"
                  >
                    <option value="">All Types</option>
                    {expenseTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#476788] mb-1">
                    Amount Range
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="number"
                      value={filters.minAmount}
                      onChange={(e) =>
                        handleFilterChange("minAmount", e.target.value)
                      }
                      placeholder="Min"
                      className="input-field w-full"
                    />
                    <input
                      type="number"
                      value={filters.maxAmount}
                      onChange={(e) =>
                        handleFilterChange("maxAmount", e.target.value)
                      }
                      placeholder="Max"
                      className="input-field w-full"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#476788] mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={filters.startDate}
                    onChange={(e) =>
                      handleFilterChange("startDate", e.target.value)
                    }
                    className="input-field w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#476788] mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={filters.endDate}
                    onChange={(e) =>
                      handleFilterChange("endDate", e.target.value)
                    }
                    className="input-field w-full"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-[#006BFF] animate-spin" />
          </div>
        )}

        {/* Search Results */}
        {results && !loading && (
          <div className="space-y-6">
            {/* Results Summary */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg font-semibold text-[#0B3558]">
                  {results.total > 0
                    ? `${results.total} expense${
                        results.total === 1 ? "" : "s"
                      } found`
                    : "No expenses found"}
                </p>
                {results.metadata.query && (
                  <p className="text-sm text-[#476788]">
                    for &quot;{results.metadata.query}&quot;
                  </p>
                )}
              </div>
            </div>

            {/* Expense Results */}
            {results.expenses.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-[#0B3558] mb-4">
                  Expenses
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {results.expenses.map((expense) => (
                    <Link
                      key={expense._id}
                      href={`/expenses/${expense._id}`}
                      className="card p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-[#0B3558] truncate">
                          {expense.name}
                        </h4>
                        <span className="text-lg font-bold text-[#006BFF]">
                          {formatCurrency(expense.amount)}
                        </span>
                      </div>

                      <div className="space-y-1 text-sm text-[#476788]">
                        <div className="flex items-center space-x-2">
                          <Building2 className="w-4 h-4" />
                          <span>{expense.company.name}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Tag className="w-4 h-4" />
                          <span>{expense.category}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4" />
                          <span>{formatDate(expense.createdAt)}</span>
                        </div>
                      </div>

                      {expense.tags && expense.tags.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {expense.tags.slice(0, 3).map((tag, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-[#006BFF]/10 text-[#006BFF]"
                            >
                              {tag}
                            </span>
                          ))}
                          {expense.tags.length > 3 && (
                            <span className="text-xs text-[#476788]">
                              +{expense.tags.length - 3} more
                            </span>
                          )}
                        </div>
                      )}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Company Results */}
            {results.companies.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-[#0B3558] mb-4">
                  Companies
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {results.companies.map((company) => (
                    <div key={company._id} className="card p-4">
                      <div className="flex items-start space-x-3">
                        <div className="w-12 h-12 bg-[#006BFF]/10 rounded-lg flex items-center justify-center">
                          <Building2 className="w-6 h-6 text-[#006BFF]" />
                        </div>
                        <div>
                          <h4 className="font-medium text-[#0B3558]">
                            {company.name}
                          </h4>
                          {company.industry && (
                            <p className="text-sm text-[#476788]">
                              {company.industry}
                            </p>
                          )}
                          {company.address && (
                            <p className="text-sm text-[#476788]">
                              {company.address.city}, {company.address.state}
                            </p>
                          )}
                          {company.contactInfo?.email && (
                            <p className="text-sm text-[#476788]">
                              {company.contactInfo.email}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Empty State */}
            {results.total === 0 && (
              <div className="text-center py-12">
                <Search className="w-12 h-12 text-[#A6BBD1] mx-auto mb-4" />
                <h3 className="text-lg font-medium text-[#476788] mb-2">
                  No results found
                </h3>
                <p className="text-[#A6BBD1] mb-4">
                  Try adjusting your search terms or filters
                </p>
                {hasActiveFilters && (
                  <button onClick={clearFilters} className="btn-secondary">
                    Clear filters
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Empty Initial State */}
        {!results && !loading && (
          <div className="text-center py-12">
            <Search className="w-12 h-12 text-[#A6BBD1] mx-auto mb-4" />
            <h3 className="text-lg font-medium text-[#476788] mb-2">
              Search your expenses and companies
            </h3>
            <p className="text-[#A6BBD1]">
              Use the search bar above to find expenses, companies, or use
              filters to narrow down results
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-[#006BFF]" />
      </div>
    }>
      <SearchPageContent />
    </Suspense>
  );
}
