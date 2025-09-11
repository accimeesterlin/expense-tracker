"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  TrendingUp,
  Plus,
  Search,
  Calendar,
  DollarSign,
  Edit,
  Trash2,
} from "lucide-react";
import AppLayout from "@/components/AppLayout";
import SimpleIncomeModal from "@/components/SimpleIncomeModal";
import ErrorModal from "@/components/ErrorModal";

interface Income {
  _id: string;
  source: string;
  description?: string;
  amount: number;
  currency: string;
  frequency: string;
  category: string;
  paymentMethod?: {
    _id: string;
    name: string;
    type:
      | "credit_card"
      | "debit_card"
      | "bank_account"
      | "digital_wallet"
      | "other";
    lastFourDigits?: string;
    isDefault: boolean;
  };
  company?: {
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
  };
  receivedDate: string;
  nextPaymentDate?: string;
  isRecurring: boolean;
  isActive: boolean;
  tags: string[];
  notes?: string;
  createdAt: string;
}

export default function IncomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [filteredIncomes, setFilteredIncomes] = useState<Income[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("date");
  const [showIncomeModal, setShowIncomeModal] = useState(false);
  const [selectedIncome, setSelectedIncome] = useState<Income | undefined>(
    undefined
  );
  const [errorModal, setErrorModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
  }>({
    isOpen: false,
    title: "",
    message: "",
  });

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/auth/signin");
      return;
    }
    fetchIncomes();
  }, [session, status, router]);

  const fetchIncomes = async () => {
    try {
      const response = await fetch("/api/income");
      if (response.ok) {
        const data = await response.json();
        setIncomes(data);
      }
    } catch (error) {
      console.error("Error fetching incomes:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortIncomes = useCallback(() => {
    const filtered = incomes.filter((income) => {
      const matchesSearch = income.source
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchesType =
        selectedType === "all" || income.category === selectedType;
      return matchesSearch && matchesType;
    });

    // Sort incomes
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "amount":
          return b.amount - a.amount;
        case "name":
          return a.source.localeCompare(b.source);
        case "type":
          return a.category.localeCompare(b.category);
        case "date":
        default:
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
      }
    });

    setFilteredIncomes(filtered);
  }, [incomes, searchTerm, selectedType, sortBy]);

  useEffect(() => {
    filterAndSortIncomes();
  }, [filterAndSortIncomes]);

  const handleIncomeCreated = (newIncome: Income) => {
    if (selectedIncome) {
      // Update existing income
      setIncomes((prev) =>
        prev.map((i) => (i._id === newIncome._id ? newIncome : i))
      );
    } else {
      // Add new income
      setIncomes((prev) => [newIncome, ...prev]);
    }
    setShowIncomeModal(false);
    setSelectedIncome(undefined);
  };

  const handleDeleteIncome = async (incomeId: string) => {
    if (!confirm("Are you sure you want to delete this income?")) {
      return;
    }

    try {
      const response = await fetch(`/api/income/${incomeId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setIncomes((prev) => prev.filter((i) => i._id !== incomeId));
      } else {
        const errorData = await response.json();
        setErrorModal({
          isOpen: true,
          title: "Delete Failed",
          message: errorData.error || "Failed to delete income",
        });
      }
    } catch (error) {
      console.error("Error deleting income:", error);
      setErrorModal({
        isOpen: true,
        title: "Delete Failed",
        message: "Failed to delete income. Please try again.",
      });
    }
  };

  const formatCurrency = (amount: number) => {
    if (amount == null || isNaN(amount)) {
      return "$0.00";
    }
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      salary: "bg-blue-100 text-blue-800",
      freelance: "bg-purple-100 text-purple-800",
      business: "bg-green-100 text-green-800",
      investment: "bg-yellow-100 text-yellow-800",
      rental: "bg-indigo-100 text-indigo-800",
      other: "bg-gray-100 text-gray-800",
    };
    return colors[type] || colors["other"];
  };

  const getFrequencyLabel = (frequency: string) => {
    const labels: Record<string, string> = {
      weekly: "Weekly",
      bi_weekly: "Bi-weekly",
      monthly: "Monthly",
      quarterly: "Quarterly",
      yearly: "Yearly",
      one_time: "One-time",
    };
    return labels[frequency] || frequency;
  };

  const getUniqueTypes = () => {
    const types = [
      ...new Set(
        incomes
          .map((income) => income.category)
          .filter((type) => type && typeof type === "string")
      ),
    ];
    return types.sort();
  };

  const totalIncomeAmount = incomes.reduce(
    (sum, income) => sum + income.amount,
    0
  );
  const monthlyIncomeAmount = incomes
    .filter((income) => income.frequency === "monthly")
    .reduce((sum, income) => sum + income.amount, 0);

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
    <AppLayout title="Income">
      {/* Page Header */}
      <div className="bg-white border-b border-[#E5E7EB] -m-3 sm:-m-4 lg:-m-6 mb-3 sm:mb-4 lg:mb-6 w-full overflow-x-hidden">
        <div className="w-full px-3 sm:px-4 lg:px-6 py-3 sm:py-4 lg:py-6 overflow-x-hidden">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="w-7 h-7 sm:w-8 sm:h-8 lg:w-10 lg:h-10 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-green-600" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-lg sm:text-xl lg:text-2xl font-semibold text-[#0B3558] truncate">
                  Income Management
                </h1>
                <p className="text-xs sm:text-sm text-[#476788] truncate">
                  Track and manage your income sources
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowIncomeModal(true)}
              className="btn-primary inline-flex items-center space-x-2 text-sm sm:text-base w-full sm:w-auto justify-center"
            >
              <Plus className="w-4 h-4" />
              <span>Add Income</span>
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-4 sm:space-y-6 lg:space-y-8 w-full overflow-x-hidden">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 lg:gap-4 w-full">
          <div className="card p-3 sm:p-4 lg:p-6">
            <div className="flex items-center">
              <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-green-100 rounded-lg flex items-center justify-center mr-2 sm:mr-3 lg:mr-4 flex-shrink-0">
                <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-green-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-[#476788] truncate">
                  Total Income
                </p>
                <p
                  className="text-lg sm:text-xl lg:text-2xl font-bold text-[#0B3558] truncate"
                  title={formatCurrency(totalIncomeAmount)}
                >
                  {formatCurrency(totalIncomeAmount)}
                </p>
              </div>
            </div>
          </div>
          <div className="card p-3 sm:p-4 lg:p-6">
            <div className="flex items-center">
              <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-2 sm:mr-3 lg:mr-4 flex-shrink-0">
                <Calendar className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-blue-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-[#476788] truncate">
                  Monthly Income
                </p>
                <p
                  className="text-lg sm:text-xl lg:text-2xl font-bold text-[#0B3558] truncate"
                  title={formatCurrency(monthlyIncomeAmount)}
                >
                  {formatCurrency(monthlyIncomeAmount)}
                </p>
              </div>
            </div>
          </div>
          <div className="card p-3 sm:p-4 lg:p-6 sm:col-span-2 lg:col-span-1">
            <div className="flex items-center">
              <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-purple-100 rounded-lg flex items-center justify-center mr-2 sm:mr-3 lg:mr-4 flex-shrink-0">
                <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-purple-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-[#476788] truncate">
                  Income Sources
                </p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-[#0B3558]">
                  {incomes.length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="card p-3 sm:p-4 lg:p-6">
          <div className="grid grid-cols-1 gap-3 sm:gap-4">
            <div className="input-field-with-icon">
              <Search className="icon w-4 h-4 sm:w-5 sm:h-5" />
              <input
                type="text"
                placeholder="Search income sources..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field text-sm sm:text-base"
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 lg:gap-4">
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="input-field text-sm sm:text-base"
              >
                <option value="all">All Types</option>
                {getUniqueTypes().map((type) => (
                  <option key={type} value={type}>
                    {type && typeof type === "string"
                      ? type.replace("_", " ").toUpperCase()
                      : type}
                  </option>
                ))}
              </select>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="input-field text-sm sm:text-base"
              >
                <option value="date">Sort by Date</option>
                <option value="amount">Sort by Amount</option>
                <option value="name">Sort by Name</option>
                <option value="type">Sort by Type</option>
              </select>
            </div>
          </div>
        </div>

        {/* Income List */}
        {filteredIncomes.length === 0 ? (
          <div className="card p-6 sm:p-8 lg:p-12 text-center">
            <TrendingUp className="w-10 h-10 sm:w-12 sm:h-12 lg:w-16 lg:h-16 text-[#A6BBD1] mx-auto mb-3 sm:mb-4 lg:mb-8" />
            <h3 className="text-sm sm:text-base lg:text-lg font-medium text-[#0B3558] mb-2">
              {incomes.length === 0
                ? "No income sources yet"
                : "No income sources match your filters"}
            </h3>
            <p className="text-xs sm:text-sm lg:text-base text-[#476788] mb-3 sm:mb-4 lg:mb-6">
              {incomes.length === 0
                ? "Start tracking your income sources to get a better view of your financial situation"
                : "Try adjusting your search or filters"}
            </p>
            <button
              onClick={() => setShowIncomeModal(true)}
              className="btn-primary inline-flex items-center space-x-2 text-xs sm:text-sm lg:text-base"
            >
              <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
              <span>Add Your First Income</span>
            </button>
          </div>
        ) : (
          <div className="space-y-2 sm:space-y-3 lg:space-y-4 w-full overflow-x-hidden">
            {filteredIncomes.map((income) => (
              <div
                key={income._id}
                className="card p-3 sm:p-4 lg:p-6 w-full overflow-hidden"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3 lg:gap-4 w-full">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-2 sm:mb-3">
                      <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-[#0B3558] truncate">
                        {income.source}
                      </h3>
                      <span
                        className={`px-1.5 py-0.5 sm:px-2 sm:py-0.5 lg:px-2.5 lg:py-1 rounded-full text-xs font-medium ${getTypeColor(
                          income.category
                        )}`}
                      >
                        {income.category?.replace("_", " ").toUpperCase() ||
                          "UNKNOWN"}
                      </span>
                      {income.frequency && (
                        <span className="px-1.5 py-0.5 sm:px-2 sm:py-0.5 lg:px-2.5 lg:py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {getFrequencyLabel(income.frequency)}
                        </span>
                      )}
                      {!income.isActive && (
                        <span className="px-1.5 py-0.5 sm:px-2 sm:py-0.5 lg:px-2.5 lg:py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                          INACTIVE
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 sm:gap-2 lg:gap-4 text-xs sm:text-sm text-[#476788]">
                      <div>
                        <span className="font-medium">Amount: </span>
                        <span className="text-[#0B3558] font-semibold">
                          {formatCurrency(income.amount)}
                        </span>
                      </div>
                      {income.nextPaymentDate && (
                        <div>
                          <span className="font-medium">Next Payment: </span>
                          <span className="text-[#0B3558]">
                            {formatDate(income.nextPaymentDate)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-end space-x-1 sm:space-x-2">
                    <button
                      onClick={() => {
                        setSelectedIncome(income);
                        setShowIncomeModal(true);
                      }}
                      className="p-1 sm:p-1.5 lg:p-2 text-[#476788] hover:text-[#006BFF] hover:bg-[#006BFF]/10 rounded-lg transition-colors"
                      title="Edit income"
                    >
                      <Edit className="w-3 h-3 sm:w-3.5 sm:h-3.5 lg:w-4 lg:h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteIncome(income._id)}
                      className="p-1 sm:p-1.5 lg:p-2 text-[#476788] hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete income"
                    >
                      <Trash2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 lg:w-4 lg:h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {showIncomeModal && (
        <SimpleIncomeModal
          isOpen={showIncomeModal}
          onClose={() => {
            setShowIncomeModal(false);
            setSelectedIncome(undefined);
          }}
          onSuccess={handleIncomeCreated}
          income={selectedIncome}
        />
      )}

      {/* Error Modal */}
      <ErrorModal
        isOpen={errorModal.isOpen}
        onClose={() => setErrorModal({ ...errorModal, isOpen: false })}
        title={errorModal.title}
        message={errorModal.message}
      />
    </AppLayout>
  );
}
