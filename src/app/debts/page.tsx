"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Plus,
  Search,
  Calendar,
  DollarSign,
  Edit,
  Trash2,
  ArrowLeft,
} from "lucide-react";
import SimpleDebtModal from "@/components/SimpleDebtModal";
import Sidebar from "@/components/Sidebar";

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
  paymentMethod?: {
    _id: string;
    name: string;
    type: "credit_card" | "debit_card" | "bank_account" | "digital_wallet" | "other";
    lastFourDigits?: string;
    isDefault: boolean;
  };
  creditor?: string;
  accountNumber?: string;
  isActive: boolean;
  tags: string[];
  notes?: string;
  createdAt: string;
}

export default function DebtsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [debts, setDebts] = useState<Debt[]>([]);
  const [filteredDebts, setFilteredDebts] = useState<Debt[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("date");
  const [showDebtModal, setShowDebtModal] = useState(false);
  const [selectedDebt, setSelectedDebt] = useState<Debt | undefined>(undefined);
  const [showSidebar, setShowSidebar] = useState(false);

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/auth/signin");
      return;
    }
    fetchDebts();
  }, [session, status, router]);

  const fetchDebts = async () => {
    try {
      const response = await fetch("/api/debts");
      if (response.ok) {
        const data = await response.json();
        setDebts(data);
      }
    } catch (error) {
      console.error("Error fetching debts:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortDebts = useCallback(() => {
    const filtered = debts.filter((debt) => {
      const matchesSearch = debt.name
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchesType = selectedType === "all" || debt.type === selectedType;
      return matchesSearch && matchesType;
    });

    // Sort debts
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "amount":
          return b.currentBalance - a.currentBalance;
        case "name":
          return a.name.localeCompare(b.name);
        case "type":
          return a.type.localeCompare(b.type);
        case "date":
        default:
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
      }
    });

    setFilteredDebts(filtered);
  }, [debts, searchTerm, selectedType, sortBy]);

  useEffect(() => {
    filterAndSortDebts();
  }, [filterAndSortDebts]);

  const handleDebtCreated = (newDebt: Debt) => {
    if (selectedDebt) {
      // Update existing debt
      setDebts((prev) =>
        prev.map((d) => (d._id === newDebt._id ? newDebt : d))
      );
    } else {
      // Add new debt
      setDebts((prev) => [newDebt, ...prev]);
    }
    setShowDebtModal(false);
    setSelectedDebt(undefined);
  };

  const handleDeleteDebt = async (debtId: string) => {
    if (!confirm("Are you sure you want to delete this debt?")) {
      return;
    }

    try {
      const response = await fetch(`/api/debts/${debtId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setDebts((prev) => prev.filter((d) => d._id !== debtId));
      } else {
        const errorData = await response.json();
        alert(errorData.error || "Failed to delete debt");
      }
    } catch (error) {
      console.error("Error deleting debt:", error);
      alert("Failed to delete debt. Please try again.");
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
      credit_card: "bg-red-100 text-red-800",
      personal_loan: "bg-orange-100 text-orange-800",
      student_loan: "bg-blue-100 text-blue-800",
      mortgage: "bg-green-100 text-green-800",
      auto_loan: "bg-purple-100 text-purple-800",
      other: "bg-gray-100 text-gray-800",
    };
    return colors[type] || colors["other"];
  };

  const getUniqueTypes = () => {
    const types = [...new Set(debts.map((debt) => debt.type))];
    return types.sort();
  };

  const totalDebtAmount = debts.reduce((sum, debt) => sum + debt.currentBalance, 0);

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
    <div className="min-h-screen bg-[#F8F9FB] flex">
      <Sidebar isOpen={showSidebar} onClose={() => setShowSidebar(false)} />
      <div className="flex-1 lg:ml-0">
        {/* Header */}
        <header className="bg-white border-b border-[#E5E7EB]">
          <div className="w-full px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0 py-4 sm:py-0 sm:h-16">
              <div className="flex items-center space-x-2 sm:space-x-3">
                <button
                  onClick={() => router.back()}
                  className="p-2 text-[#476788] hover:text-[#0B3558] hover:bg-[#F8F9FB] rounded-lg transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-semibold text-[#0B3558]">
                    Debt Management
                  </h1>
                  <p className="text-xs sm:text-sm text-[#476788]">
                    Track and manage your debts
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowDebtModal(true)}
                className="btn-primary inline-flex items-center space-x-2 text-sm sm:text-base w-full sm:w-auto justify-center"
              >
                <Plus className="w-4 h-4" />
                <span>Add Debt</span>
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="w-full px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6 mb-4 sm:mb-6 lg:mb-8">
            <div className="card p-4 sm:p-6">
              <div className="flex items-center">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-100 rounded-lg flex items-center justify-center mr-3 sm:mr-4">
                  <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-[#476788] truncate">
                    Total Debt
                  </p>
                  <p className="text-xl sm:text-2xl font-bold text-[#0B3558] truncate" title={formatCurrency(totalDebtAmount)}>
                    {formatCurrency(totalDebtAmount)}
                  </p>
                </div>
              </div>
            </div>
            <div className="card p-4 sm:p-6">
              <div className="flex items-center">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-3 sm:mr-4">
                  <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-[#476788] truncate">
                    Active Debts
                  </p>
                  <p className="text-xl sm:text-2xl font-bold text-[#0B3558]">
                    {debts.filter((d) => d.isActive).length}
                  </p>
                </div>
              </div>
            </div>
            <div className="card p-4 sm:p-6 sm:col-span-2 lg:col-span-1">
              <div className="flex items-center">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-lg flex items-center justify-center mr-3 sm:mr-4">
                  <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-[#476788] truncate">
                    Total Debts
                  </p>
                  <p className="text-xl sm:text-2xl font-bold text-[#0B3558]">
                    {debts.length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="card p-4 sm:p-6 mb-6 sm:mb-8">
            <div className="grid grid-cols-1 gap-4">
              <div className="input-field-with-icon">
                <Search className="icon w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search debts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input-field text-sm sm:text-base"
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="input-field text-sm sm:text-base"
                >
                  <option value="all">All Types</option>
                  {getUniqueTypes().map((type) => (
                    <option key={type} value={type}>
                      {type.replace("_", " ").toUpperCase()}
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

          {/* Debts List */}
          {filteredDebts.length === 0 ? (
            <div className="card p-8 sm:p-12 text-center">
              <AlertTriangle className="w-12 h-12 sm:w-16 sm:h-16 text-[#A6BBD1] mx-auto mb-4 sm:mb-8" />
              <h3 className="text-base sm:text-lg font-medium text-[#0B3558] mb-2">
                {debts.length === 0
                  ? "No debts tracked yet"
                  : "No debts match your filters"}
              </h3>
              <p className="text-sm sm:text-base text-[#476788] mb-4 sm:mb-6">
                {debts.length === 0
                  ? "Start tracking your debts to get a better view of your financial situation"
                  : "Try adjusting your search or filters"}
              </p>
              <button
                onClick={() => setShowDebtModal(true)}
                className="btn-primary inline-flex items-center space-x-2 text-sm sm:text-base"
              >
                <Plus className="w-4 h-4" />
                <span>Add Your First Debt</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {filteredDebts.map((debt) => (
                <div key={debt._id} className="card p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2 sm:mb-3">
                        <h3 className="text-base sm:text-lg font-semibold text-[#0B3558] truncate">
                          {debt.name}
                        </h3>
                        <span
                          className={`px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-xs font-medium ${getTypeColor(
                            debt.type
                          )}`}
                        >
                          {debt.type.replace("_", " ").toUpperCase()}
                        </span>
                        {!debt.isActive && (
                          <span className="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                            INACTIVE
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4 text-xs sm:text-sm text-[#476788]">
                        <div>
                          <span className="font-medium">Amount: </span>
                          <span className="text-[#0B3558] font-semibold">
                            {formatCurrency(debt.currentBalance)}
                          </span>
                        </div>
                        {debt.interestRate && (
                          <div>
                            <span className="font-medium">Interest Rate: </span>
                            <span className="text-[#0B3558]">
                              {debt.interestRate}%
                            </span>
                          </div>
                        )}
                        {debt.minimumPayment && (
                          <div>
                            <span className="font-medium">Min Payment: </span>
                            <span className="text-[#0B3558]">
                              {formatCurrency(debt.minimumPayment)}
                            </span>
                          </div>
                        )}
                      </div>
                      {debt.nextPaymentDate && (
                        <div className="mt-2 text-xs sm:text-sm text-[#476788]">
                          <span className="font-medium">Next Payment: </span>
                          <span className="text-[#0B3558]">
                            {formatDate(debt.nextPaymentDate)}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => {
                          setSelectedDebt(debt);
                          setShowDebtModal(true);
                        }}
                        className="p-1.5 sm:p-2 text-[#476788] hover:text-[#006BFF] hover:bg-[#006BFF]/10 rounded-lg transition-colors"
                        title="Edit debt"
                      >
                        <Edit className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteDebt(debt._id)}
                        className="p-1.5 sm:p-2 text-[#476788] hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete debt"
                      >
                        <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>

        {/* Modal */}
        {showDebtModal && (
          <SimpleDebtModal
            isOpen={showDebtModal}
            onClose={() => {
              setShowDebtModal(false);
              setSelectedDebt(undefined);
            }}
            onSuccess={handleDebtCreated}
            debt={selectedDebt}
          />
        )}
      </div>
    </div>
  );
}
