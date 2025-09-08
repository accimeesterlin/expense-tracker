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
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => router.back()}
                  className="p-2 text-[#476788] hover:text-[#0B3558] hover:bg-[#F8F9FB] rounded-lg transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-semibold text-[#0B3558]">
                    Debt Management
                  </h1>
                  <p className="text-sm text-[#476788]">
                    Track and manage your debts
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowDebtModal(true)}
                className="btn-primary inline-flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Add Debt</span>
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="card p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mr-4">
                  <DollarSign className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-[#476788]">
                    Total Debt
                  </p>
                  <p className="text-2xl font-bold text-[#0B3558]">
                    {formatCurrency(totalDebtAmount)}
                  </p>
                </div>
              </div>
            </div>
            <div className="card p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                  <AlertTriangle className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-[#476788]">
                    Active Debts
                  </p>
                  <p className="text-2xl font-bold text-[#0B3558]">
                    {debts.filter((d) => d.isActive).length}
                  </p>
                </div>
              </div>
            </div>
            <div className="card p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                  <Calendar className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-[#476788]">
                    Total Debts
                  </p>
                  <p className="text-2xl font-bold text-[#0B3558]">
                    {debts.length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="card p-6 mb-8">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="w-5 h-5 text-[#476788] absolute left-3 top-1/2 transform -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search debts..."
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
                      {type.replace("_", " ").toUpperCase()}
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

          {/* Debts List */}
          {filteredDebts.length === 0 ? (
            <div className="card p-12 text-center">
              <AlertTriangle className="w-16 h-16 text-[#A6BBD1] mx-auto mb-8" />
              <h3 className="text-lg font-medium text-[#0B3558] mb-2">
                {debts.length === 0
                  ? "No debts tracked yet"
                  : "No debts match your filters"}
              </h3>
              <p className="text-[#476788] mb-6">
                {debts.length === 0
                  ? "Start tracking your debts to get a better view of your financial situation"
                  : "Try adjusting your search or filters"}
              </p>
              <button
                onClick={() => setShowDebtModal(true)}
                className="btn-primary inline-flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Add Your First Debt</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredDebts.map((debt) => (
                <div key={debt._id} className="card p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-[#0B3558]">
                          {debt.name}
                        </h3>
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-medium ${getTypeColor(
                            debt.type
                          )}`}
                        >
                          {debt.type.replace("_", " ").toUpperCase()}
                        </span>
                        {!debt.isActive && (
                          <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                            INACTIVE
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm text-[#476788]">
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
                        <div className="mt-2 text-sm text-[#476788]">
                          <span className="font-medium">Next Payment: </span>
                          <span className="text-[#0B3558]">
                            {formatDate(debt.nextPaymentDate)}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => {
                          setSelectedDebt(debt);
                          setShowDebtModal(true);
                        }}
                        className="p-2 text-[#476788] hover:text-[#006BFF] hover:bg-[#006BFF]/10 rounded-lg transition-colors"
                        title="Edit debt"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteDebt(debt._id)}
                        className="p-2 text-[#476788] hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete debt"
                      >
                        <Trash2 className="w-4 h-4" />
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
