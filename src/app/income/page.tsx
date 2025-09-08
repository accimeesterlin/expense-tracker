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
  ArrowLeft,
} from "lucide-react";
import AppLayout from "@/components/AppLayout";
import SimpleIncomeModal from "@/components/SimpleIncomeModal";

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
        alert(errorData.error || "Failed to delete income");
      }
    } catch (error) {
      console.error("Error deleting income:", error);
      alert("Failed to delete income. Please try again.");
    }
  };

  const formatCurrency = (amount: number) => {
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
      <div className="bg-white border-b border-[#E5E7EB] -m-6 mb-6">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-[#0B3558]">
                  Income Management
                </h1>
                <p className="text-sm text-[#476788]">
                  Track and manage your income sources
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowIncomeModal(true)}
              className="btn-primary inline-flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add Income</span>
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-[#476788]">
                  Total Income
                </p>
                <p className="text-2xl font-bold text-[#0B3558]">
                  {formatCurrency(totalIncomeAmount)}
                </p>
              </div>
            </div>
          </div>
          <div className="card p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-[#476788]">
                  Monthly Income
                </p>
                <p className="text-2xl font-bold text-[#0B3558]">
                  {formatCurrency(monthlyIncomeAmount)}
                </p>
              </div>
            </div>
          </div>
          <div className="card p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mr-4">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-[#476788]">
                  Income Sources
                </p>
                <p className="text-2xl font-bold text-[#0B3558]">
                  {incomes.length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="card p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="w-5 h-5 text-[#476788] absolute left-4 top-1/2 transform -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search income sources..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input-field pl-12"
                />
              </div>
            </div>
            <div className="flex gap-4">
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="input-field"
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
                className="input-field"
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
          <div className="card p-12 text-center">
            <TrendingUp className="w-16 h-16 text-[#A6BBD1] mx-auto mb-8" />
            <h3 className="text-lg font-medium text-[#0B3558] mb-2">
              {incomes.length === 0
                ? "No income sources yet"
                : "No income sources match your filters"}
            </h3>
            <p className="text-[#476788] mb-6">
              {incomes.length === 0
                ? "Start tracking your income sources to get a better view of your financial situation"
                : "Try adjusting your search or filters"}
            </p>
            <button
              onClick={() => setShowIncomeModal(true)}
              className="btn-primary inline-flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add Your First Income</span>
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredIncomes.map((income) => (
              <div key={income._id} className="card p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-[#0B3558]">
                        {income.source}
                      </h3>
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-medium ${getTypeColor(
                          income.category
                        )}`}
                      >
                        {income.category?.replace("_", " ").toUpperCase() ||
                          "UNKNOWN"}
                      </span>
                      {income.frequency && (
                        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {getFrequencyLabel(income.frequency)}
                        </span>
                      )}
                      {!income.isActive && (
                        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                          INACTIVE
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-[#476788]">
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
                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => {
                        setSelectedIncome(income);
                        setShowIncomeModal(true);
                      }}
                      className="p-2 text-[#476788] hover:text-[#006BFF] hover:bg-[#006BFF]/10 rounded-lg transition-colors"
                      title="Edit income"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteIncome(income._id)}
                      className="p-2 text-[#476788] hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete income"
                    >
                      <Trash2 className="w-4 h-4" />
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
    </AppLayout>
  );
}
