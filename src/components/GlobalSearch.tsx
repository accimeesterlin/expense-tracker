"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import {
  Search,
  X,
  Building2,
  CreditCard,
  TrendingUp,
  AlertTriangle,
  PiggyBank,
} from "lucide-react";

interface SearchResult {
  id: string;
  type: "company" | "expense" | "income" | "debt" | "asset";
  name: string;
  amount?: number;
  category?: string;
  date?: string;
}

export default function GlobalSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const searchData = useCallback(async () => {
    setLoading(true);
    try {
      const [companiesRes, expensesRes, incomeRes, debtsRes, assetsRes] =
        await Promise.all([
          fetch("/api/companies"),
          fetch("/api/expenses"),
          fetch("/api/income"),
          fetch("/api/debts"),
          fetch("/api/assets"),
        ]);

      const allResults: SearchResult[] = [];

      if (companiesRes.ok) {
        const companies = await companiesRes.json();
        companies.forEach(
          (company: { _id: string; name: string; industry: string }) => {
            if (company.name.toLowerCase().includes(query.toLowerCase())) {
              allResults.push({
                id: company._id,
                type: "company",
                name: company.name,
                category: company.industry,
              });
            }
          }
        );
      }

      if (expensesRes.ok) {
        const expenses = await expensesRes.json();
        expenses.forEach(
          (expense: {
            _id: string;
            name: string;
            category: string;
            amount: number;
            company: { name: string };
          }) => {
            if (
              expense.name.toLowerCase().includes(query.toLowerCase()) ||
              expense.category.toLowerCase().includes(query.toLowerCase())
            ) {
              allResults.push({
                id: expense._id,
                type: "expense",
                name: expense.name,
                amount: expense.amount,
                category: expense.category,
                date:
                  (expense as { nextBillingDate?: string; createdAt?: string })
                    .nextBillingDate ||
                  (expense as { nextBillingDate?: string; createdAt?: string })
                    .createdAt,
              });
            }
          }
        );
      }

      if (incomeRes.ok) {
        const income = await incomeRes.json();
        income.forEach(
          (inc: {
            _id: string;
            source: string;
            category: string;
            amount: number;
          }) => {
            if (
              inc.source.toLowerCase().includes(query.toLowerCase()) ||
              inc.category.toLowerCase().includes(query.toLowerCase())
            ) {
              allResults.push({
                id: inc._id,
                type: "income",
                name: inc.source,
                amount: inc.amount,
                category: inc.category,
                date:
                  (inc as { receivedDate?: string; createdAt?: string })
                    .receivedDate ||
                  (inc as { receivedDate?: string; createdAt?: string })
                    .createdAt,
              });
            }
          }
        );
      }

      if (debtsRes.ok) {
        const debts = await debtsRes.json();
        debts.forEach(
          (debt: {
            _id: string;
            name: string;
            type: string;
            currentBalance: number;
          }) => {
            if (
              debt.name.toLowerCase().includes(query.toLowerCase()) ||
              debt.type.toLowerCase().includes(query.toLowerCase())
            ) {
              allResults.push({
                id: debt._id,
                type: "debt",
                name: debt.name,
                amount: debt.currentBalance,
                category: debt.type,
                date:
                  (debt as { nextPaymentDate?: string; createdAt?: string })
                    .nextPaymentDate ||
                  (debt as { nextPaymentDate?: string; createdAt?: string })
                    .createdAt,
              });
            }
          }
        );
      }

      if (assetsRes.ok) {
        const assets = await assetsRes.json();
        assets.forEach(
          (asset: {
            _id: string;
            name: string;
            category: string;
            currentValue: number;
          }) => {
            if (
              asset.name.toLowerCase().includes(query.toLowerCase()) ||
              asset.category.toLowerCase().includes(query.toLowerCase())
            ) {
              allResults.push({
                id: asset._id,
                type: "asset",
                name: asset.name,
                amount: asset.currentValue,
                category: asset.category,
              });
            }
          }
        );
      }

      setResults(allResults.slice(0, 10)); // Limit to 10 results
    } catch (error) {
      console.error("Error searching:", error);
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    if (query.length > 2) {
      searchData();
    } else {
      setResults([]);
    }
  }, [query, searchData]);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "company":
        return <Building2 className="w-4 h-4" />;
      case "expense":
        return <CreditCard className="w-4 h-4" />;
      case "income":
        return <TrendingUp className="w-4 h-4" />;
      case "debt":
        return <AlertTriangle className="w-4 h-4" />;
      case "asset":
        return <PiggyBank className="w-4 h-4" />;
      default:
        return <Search className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "company":
        return "text-blue-600 bg-blue-50";
      case "expense":
        return "text-red-600 bg-red-50";
      case "income":
        return "text-green-600 bg-green-50";
      case "debt":
        return "text-orange-600 bg-orange-50";
      case "asset":
        return "text-purple-600 bg-purple-50";
      default:
        return "text-gray-600 bg-gray-50";
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
    });
  };

  const getResultUrl = (result: SearchResult) => {
    switch (result.type) {
      case "company":
        return `/companies/${result.id}`;
      case "expense":
        return `/expenses/${result.id}`;
      case "income":
        return `/income`;
      case "debt":
        return `/debts`;
      case "asset":
        return `/dashboard`; // or wherever assets are managed
      default:
        return "/dashboard";
    }
  };

  return (
    <div className="relative" ref={searchRef}>
      <div className="input-field-with-icon">
        <Search className="icon w-4 h-4" />
        <input
          type="text"
          placeholder="Search companies, expenses, income..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsOpen(true)}
          className="w-64 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        {query && (
          <button
            onClick={() => {
              setQuery("");
              setIsOpen(false);
            }}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {isOpen && query.length > 2 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-gray-500">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2">Searching...</p>
            </div>
          ) : results.length > 0 ? (
            <div className="py-2">
              {results.map((result) => (
                <Link
                  key={`${result.type}-${result.id}`}
                  href={getResultUrl(result)}
                  className="flex items-center space-x-3 px-4 py-3 hover:bg-gray-50 cursor-pointer"
                  onClick={() => setIsOpen(false)}
                >
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center ${getTypeColor(
                      result.type
                    )}`}
                  >
                    {getTypeIcon(result.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {result.name}
                    </p>
                    <div className="flex items-center space-x-2 text-xs text-gray-500">
                      <span className="capitalize">{result.type}</span>
                      {result.category && (
                        <>
                          <span>•</span>
                          <span>{result.category}</span>
                        </>
                      )}
                      {result.date && (
                        <>
                          <span>•</span>
                          <span>{formatDate(result.date)}</span>
                        </>
                      )}
                    </div>
                  </div>
                  {result.amount && (
                    <div className="text-sm font-medium text-gray-900">
                      {formatCurrency(result.amount)}
                    </div>
                  )}
                </Link>
              ))}
            </div>
          ) : (
            <div className="p-4 text-center text-gray-500">
              <Search className="w-8 h-8 mx-auto mb-2 text-gray-300" />
              <p>No results found for &quot;{query}&quot;</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
