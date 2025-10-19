"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import {
  Building2,
  Plus,
  Search,
  Edit,
  Mail,
  Users,
  User,
  CreditCard,
  Calendar,
  DollarSign,
} from "lucide-react";
import AppLayout from "@/components/AppLayout";
import CompanyModal from "@/components/CompanyModal";
import ExpenseModal from "@/components/ExpenseModal";
import ExpenseCard from "@/components/ExpenseCard";
import ErrorModal from "@/components/ErrorModal";

interface Company {
  _id: string;
  name: string;
  industry: string;
  description?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
  };
  contactInfo?: {
    email?: string;
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

interface TeamMember {
  _id: string;
  name: string;
  email: string;
  role: string;
  company: string;
}

export default function CompanyDetailsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const companyId = params?.id as string;

  const [company, setCompany] = useState<Company | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [filteredExpenses, setFilteredExpenses] = useState<Expense[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"expenses" | "team" | "overview" | "analytics" | "payments">(
    "overview"
  );
  const [mounted, setMounted] = useState(false);
  const [userPermissions, setUserPermissions] = useState<string[]>([]);
  const [isOwner, setIsOwner] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [expenseFilter, setExpenseFilter] = useState<string>("all");
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | undefined>(
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

  const fetchCompanyDetails = useCallback(async () => {
    try {
      const [companyRes, expensesRes, teamRes, paymentsRes, permissionsRes] = await Promise.all([
        fetch(`/api/companies/${companyId}`),
        fetch(`/api/expenses?companyId=${companyId}`),
        fetch(`/api/team-members?companyId=${companyId}`),
        fetch(`/api/payments?company=${companyId}`),
        fetch(`/api/user-permissions?companyId=${companyId}`),
      ]);

      if (companyRes.ok) {
        const companyData = await companyRes.json();
        setCompany(companyData);
      }

      if (permissionsRes.ok) {
        const permissionsData = await permissionsRes.json();
        setUserPermissions(permissionsData.permissions || []);
        setIsOwner(permissionsData.isOwner || false);
      }

      if (expensesRes.ok) {
        const expensesData = await expensesRes.json();
        setExpenses(expensesData);
      }

      if (teamRes.ok) {
        const teamData = await teamRes.json();
        setTeamMembers(teamData);
      }

      if (paymentsRes.ok) {
        const paymentsData = await paymentsRes.json();
        setPayments(paymentsData.payments || []);
      }
    } catch (error) {
      console.error("Error fetching company details:", error);
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  const filterExpenses = useCallback(() => {
    const filtered = expenses.filter((expense) => {
      const matchesSearch =
        expense.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        expense.category.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter =
        expenseFilter === "all" ||
        (expenseFilter === "active" && expense.isActive) ||
        (expenseFilter === "inactive" && !expense.isActive) ||
        expense.expenseType === expenseFilter;
      return matchesSearch && matchesFilter;
    });
    setFilteredExpenses(filtered);
  }, [expenses, searchTerm, expenseFilter]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/auth/signin");
      return;
    }
    if (companyId) {
      fetchCompanyDetails();
    }
  }, [session, status, router, companyId, fetchCompanyDetails]);

  useEffect(() => {
    filterExpenses();
  }, [filterExpenses]);

  const handleCompanyUpdated = (updatedCompany: Company) => {
    setCompany(updatedCompany);
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
        setErrorModal({
          isOpen: true,
          title: "Delete Failed",
          message: errorData.error || "Failed to delete expense",
        });
      }
    } catch (error) {
      console.error("Error deleting expense:", error);
      setErrorModal({
        isOpen: true,
        title: "Delete Failed",
        message: "Failed to delete expense. Please try again.",
      });
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

  const canCreateExpenses = userPermissions.includes('create_expenses') || userPermissions.includes('admin_access') || userPermissions.includes('all') || isOwner;
  const canManageCompanies = userPermissions.includes('manage_companies') || userPermissions.includes('admin_access') || userPermissions.includes('all') || isOwner;

  const totalExpenseAmount = expenses.reduce(
    (sum, expense) => sum + expense.amount,
    0
  );
  const activeExpenses = expenses.filter((e) => e.isActive).length;
  // const monthlyRecurring = expenses
  //   .filter((e) => e.expenseType === "subscription" && e.isActive)
  //   .reduce((sum, e) => sum + e.amount, 0);

  if (status === "loading" || loading || !mounted) {
    return (
      <div className="min-h-screen bg-[#F8F9FB] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#006BFF]"></div>
      </div>
    );
  }

  if (!session || !company) {
    return null;
  }

  return (
    <AppLayout title={`${company?.name || "Company"} Details`}>
      {/* Company Header */}
      <div className="bg-white border-b border-[#E5E7EB] mb-4 sm:mb-6">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0 py-4 sm:py-6">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Building2 className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-xl sm:text-2xl font-semibold text-[#0B3558] truncate">
                  {company.name}
                </h1>
                <p className="text-xs sm:text-sm text-[#476788] truncate">
                  {company.industry}
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-2 sm:gap-3">
              {canCreateExpenses && (
                <button
                  onClick={() => setShowExpenseModal(true)}
                  className="btn-secondary inline-flex items-center space-x-2 justify-center text-sm sm:text-base"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Expense</span>
                </button>
              )}
              {canManageCompanies && (
                <button
                  onClick={() => setShowCompanyModal(true)}
                  className="btn-primary inline-flex items-center space-x-2 justify-center text-sm sm:text-base"
                >
                  <Edit className="w-4 h-4" />
                  <span>Edit Company</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white border-b border-[#E5E7EB]">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-4 sm:space-x-8 overflow-x-auto">
            {["overview", "expenses", "analytics", "payments", "team"].map((tab) => (
              <button
                key={tab}
                onClick={() =>
                  setActiveTab(tab as "expenses" | "team" | "overview" | "analytics" | "payments")
                }
                className={`py-3 sm:py-4 px-1 border-b-2 font-medium text-xs sm:text-sm capitalize whitespace-nowrap ${
                  activeTab === tab
                    ? "border-[#006BFF] text-[#006BFF]"
                    : "border-transparent text-[#476788] hover:text-[#0B3558] hover:border-gray-300"
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="w-full px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        {activeTab === "overview" && (
          <div className="space-y-6 sm:space-y-8">
            {/* Company Info */}
            <div className="card p-4 sm:p-6">
              <h2 className="text-base sm:text-lg font-semibold text-[#0B3558] mb-3 sm:mb-4">
                Company Information
              </h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-3 sm:space-y-4">
                  <div>
                    <label className="text-xs sm:text-sm font-medium text-[#476788] block">
                      Industry
                    </label>
                    <p className="text-sm sm:text-base text-[#0B3558]">
                      {company.industry}
                    </p>
                  </div>
                  {company.description && (
                    <div>
                      <label className="text-xs sm:text-sm font-medium text-[#476788] block">
                        Description
                      </label>
                      <p className="text-sm sm:text-base text-[#0B3558]">
                        {company.description}
                      </p>
                    </div>
                  )}
                  <div>
                    <label className="text-xs sm:text-sm font-medium text-[#476788] block">
                      Member Since
                    </label>
                    <p className="text-sm sm:text-base text-[#0B3558]">
                      {formatDate(company.createdAt)}
                    </p>
                  </div>
                </div>
                <div className="space-y-3 sm:space-y-4">
                  <div>
                    <label className="text-xs sm:text-sm font-medium text-[#476788] block">
                      Address
                    </label>
                    <div className="text-sm sm:text-base text-[#0B3558]">
                      {company.address?.street && (
                        <p>{company.address.street}</p>
                      )}
                      {(company.address?.city || company.address?.state) && (
                        <p>
                          {company.address.city && company.address.city}
                          {company.address.city &&
                            company.address.state &&
                            ", "}
                          {company.address.state && company.address.state}
                          {company.address.zipCode &&
                            ` ${company.address.zipCode}`}
                        </p>
                      )}
                      {!company.address?.street &&
                        !company.address?.city &&
                        !company.address?.state && (
                          <span className="text-[#A6BBD1] text-sm">
                            No address information available
                          </span>
                        )}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs sm:text-sm font-medium text-[#476788] block">
                      Contact
                    </label>
                    <div className="text-sm sm:text-base text-[#0B3558] space-y-1">
                      {company.contactInfo?.email && (
                        <div className="flex items-center space-x-2">
                          <Mail className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#476788] flex-shrink-0" />
                          <span className="truncate">
                            {company.contactInfo.email}
                          </span>
                        </div>
                      )}
                      {company.contactInfo?.phone && (
                        <div className="flex items-center space-x-2">
                          <span className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-center text-[#476788] flex-shrink-0">
                            📞
                          </span>
                          <span className="truncate">
                            {company.contactInfo.phone}
                          </span>
                        </div>
                      )}
                      {company.contactInfo?.website && (
                        <div className="flex items-center space-x-2">
                          <span className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-center text-[#476788] flex-shrink-0">
                            🌐
                          </span>
                          <a
                            href={company.contactInfo.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#006BFF] hover:underline truncate"
                          >
                            {company.contactInfo.website}
                          </a>
                        </div>
                      )}
                      {!company.contactInfo?.email &&
                        !company.contactInfo?.phone &&
                        !company.contactInfo?.website && (
                          <span className="text-[#A6BBD1] text-sm">
                            No contact information available
                          </span>
                        )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

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
                    <p className="text-lg sm:text-xl font-bold text-[#0B3558]">
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
                      className="text-lg sm:text-xl font-bold text-[#0B3558] truncate"
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
                    <p className="text-lg sm:text-xl font-bold text-[#0B3558]">
                      {activeExpenses}
                    </p>
                  </div>
                </div>
              </div>
              <div className="card p-3 sm:p-4 lg:p-6">
                <div className="flex items-center">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-purple-100 rounded-lg flex items-center justify-center mr-2 sm:mr-3 lg:mr-4">
                    <Users className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-purple-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm font-medium text-[#476788] truncate">
                      Team Members
                    </p>
                    <p className="text-lg sm:text-xl font-bold text-[#0B3558]">
                      {teamMembers.length}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "expenses" && (
          <div className="space-y-4 sm:space-y-6">
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
                    className="input-field text-sm sm:text-base"
                  />
                </div>
                <select
                  value={expenseFilter}
                  onChange={(e) => setExpenseFilter(e.target.value)}
                  className="input-field text-sm sm:text-base"
                >
                  <option value="all">All Expenses</option>
                  <option value="active">Active Only</option>
                  <option value="inactive">Inactive Only</option>
                  <option value="subscription">Subscriptions</option>
                  <option value="one-time">One-time</option>
                  <option value="recurring">Recurring</option>
                </select>
              </div>
            </div>

            {/* Expenses List */}
            {filteredExpenses.length === 0 ? (
              <div className="card p-8 sm:p-12 text-center">
                <CreditCard className="w-12 h-12 sm:w-16 sm:h-16 text-[#A6BBD1] mx-auto mb-4 sm:mb-8" />
                <h3 className="text-base sm:text-lg font-medium text-[#0B3558] mb-2">
                  {expenses.length === 0
                    ? "No expenses yet"
                    : "No expenses match your filters"}
                </h3>
                <p className="text-sm sm:text-base text-[#476788] mb-4 sm:mb-6">
                  {expenses.length === 0
                    ? "Start tracking expenses for this company"
                    : "Try adjusting your search or filters"}
                </p>
                {canCreateExpenses && (
                  <button
                    onClick={() => setShowExpenseModal(true)}
                    className="btn-primary inline-flex items-center space-x-2 text-sm sm:text-base"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add First Expense</span>
                  </button>
                )}
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
        )}

        {activeTab === "team" && (
          <div className="space-y-4 sm:space-y-6">
            {teamMembers.length === 0 ? (
              <div className="card p-8 sm:p-12 text-center">
                <Users className="w-12 h-12 sm:w-16 sm:h-16 text-[#A6BBD1] mx-auto mb-4 sm:mb-8" />
                <h3 className="text-base sm:text-lg font-medium text-[#0B3558] mb-2">
                  No team members yet
                </h3>
                <p className="text-sm sm:text-base text-[#476788] mb-4 sm:mb-6">
                  Add team members to collaborate on this company
                </p>
                <button className="btn-primary inline-flex items-center space-x-2 text-sm sm:text-base">
                  <Plus className="w-4 h-4" />
                  <span>Add Team Member</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {teamMembers.map((member) => (
                  <div key={member._id} className="card p-4 sm:p-6">
                    <div className="flex items-center space-x-2 sm:space-x-3 mb-3 sm:mb-4">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#006BFF]/10 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 sm:w-6 sm:h-6 text-[#006BFF]" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-[#0B3558] text-sm sm:text-base truncate">
                          {member.name}
                        </h3>
                        <p className="text-xs sm:text-sm text-[#476788] truncate">
                          {member.role}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 text-xs sm:text-sm text-[#476788]">
                      <Mail className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                      <span className="truncate">{member.email}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        
        {activeTab === "analytics" && (
          <div className="space-y-4 sm:space-y-6">
            {/* Key Metrics Summary */}
            <div className="card p-4 sm:p-6">
              <h3 className="text-lg font-semibold text-[#0B3558] mb-4">Company Summary</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-[#0B3558]">{expenses.length}</p>
                  <p className="text-xs text-[#476788]">Total Expenses</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">{formatCurrency(totalExpenseAmount)}</p>
                  <p className="text-xs text-[#476788]">Total Spent</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">
                    {expenses.filter(e => e.expenseType === 'subscription').length}
                  </p>
                  <p className="text-xs text-[#476788]">Active Subscriptions</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-600">
                    {new Set(expenses.map(e => e.category)).size}
                  </p>
                  <p className="text-xs text-[#476788]">Categories</p>
                </div>
              </div>
            </div>

            {/* Analytics Overview Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
              <div className="card p-4 sm:p-6">
                <div className="flex items-center">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-3 sm:mr-4">
                    <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-[#476788]">
                      Average Expense
                    </p>
                    <p className="text-lg sm:text-xl font-bold text-[#0B3558]">
                      {formatCurrency(expenses.length > 0 ? totalExpenseAmount / expenses.length : 0)}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="card p-4 sm:p-6">
                <div className="flex items-center">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-lg flex items-center justify-center mr-3 sm:mr-4">
                    <CreditCard className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-[#476788]">
                      Monthly Recurring
                    </p>
                    <p className="text-lg sm:text-xl font-bold text-[#0B3558]">
                      {formatCurrency(expenses.filter(e => e.frequency === 'monthly').reduce((sum, e) => sum + e.amount, 0))}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="card p-4 sm:p-6">
                <div className="flex items-center">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 rounded-lg flex items-center justify-center mr-3 sm:mr-4">
                    <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-[#476788]">
                      Subscriptions
                    </p>
                    <p className="text-lg sm:text-xl font-bold text-[#0B3558]">
                      {expenses.filter(e => e.expenseType === 'subscription').length}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="card p-4 sm:p-6">
                <div className="flex items-center">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-100 rounded-lg flex items-center justify-center mr-3 sm:mr-4">
                    <Building2 className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-[#476788]">
                      Categories Used
                    </p>
                    <p className="text-lg sm:text-xl font-bold text-[#0B3558]">
                      {new Set(expenses.map(e => e.category)).size}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Expense Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {/* Expenses by Category */}
              <div className="card p-4 sm:p-6">
                <h3 className="text-lg font-semibold text-[#0B3558] mb-4">
                  Expenses by Category
                </h3>
                <div className="space-y-3">
                  {Object.entries(
                    expenses.reduce((acc, expense) => {
                      acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
                      return acc;
                    }, {} as Record<string, number>)
                  )
                    .sort(([,a], [,b]) => b - a)
                    .slice(0, 5)
                    .map(([category, amount]) => (
                      <div key={category} className="flex items-center justify-between">
                        <span className="text-sm text-[#476788]">{category}</span>
                        <span className="text-sm font-medium text-[#0B3558]">
                          {formatCurrency(amount)}
                        </span>
                      </div>
                    ))}
                </div>
              </div>

              {/* Expenses by Type */}
              <div className="card p-4 sm:p-6">
                <h3 className="text-lg font-semibold text-[#0B3558] mb-4">
                  Expenses by Type
                </h3>
                <div className="space-y-3">
                  {Object.entries(
                    expenses.reduce((acc, expense) => {
                      acc[expense.expenseType] = (acc[expense.expenseType] || 0) + expense.amount;
                      return acc;
                    }, {} as Record<string, number>)
                  )
                    .sort(([,a], [,b]) => b - a)
                    .map(([type, amount]) => (
                      <div key={type} className="flex items-center justify-between">
                        <span className="text-sm text-[#476788] capitalize">{type}</span>
                        <span className="text-sm font-medium text-[#0B3558]">
                          {formatCurrency(amount)}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="card p-4 sm:p-6">
              <h3 className="text-lg font-semibold text-[#0B3558] mb-4">
                Recent Expense Activity
              </h3>
              <div className="space-y-3">
                {expenses
                  .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                  .slice(0, 5)
                  .map((expense) => (
                    <div key={expense._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-[#0B3558]">{expense.name}</p>
                        <p className="text-xs text-[#476788]">
                          {new Date(expense.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                      <span className="text-sm font-medium text-[#0B3558]">
                        {formatCurrency(expense.amount)}
                      </span>
                    </div>
                  ))}
              </div>
            </div>

            {/* Advanced Analytics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {/* Expense Trends */}
              <div className="card p-4 sm:p-6">
                <h3 className="text-lg font-semibold text-[#0B3558] mb-4">Expense Trends</h3>
                <div className="space-y-4">
                  {/* Monthly Growth */}
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-[#0B3558]">This Month</p>
                      <p className="text-xs text-[#476788]">
                        {expenses.filter(e => {
                          const expenseDate = new Date(e.createdAt);
                          const now = new Date();
                          return expenseDate.getMonth() === now.getMonth() && 
                                 expenseDate.getFullYear() === now.getFullYear();
                        }).length} expenses
                      </p>
                    </div>
                    <span className="text-sm font-bold text-[#0B3558]">
                      {formatCurrency(expenses.filter(e => {
                        const expenseDate = new Date(e.createdAt);
                        const now = new Date();
                        return expenseDate.getMonth() === now.getMonth() && 
                               expenseDate.getFullYear() === now.getFullYear();
                      }).reduce((sum, e) => sum + e.amount, 0))}
                    </span>
                  </div>

                  {/* Last Month */}
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-[#0B3558]">Last Month</p>
                      <p className="text-xs text-[#476788]">
                        {expenses.filter(e => {
                          const expenseDate = new Date(e.createdAt);
                          const lastMonth = new Date();
                          lastMonth.setMonth(lastMonth.getMonth() - 1);
                          return expenseDate.getMonth() === lastMonth.getMonth() && 
                                 expenseDate.getFullYear() === lastMonth.getFullYear();
                        }).length} expenses
                      </p>
                    </div>
                    <span className="text-sm font-bold text-[#0B3558]">
                      {formatCurrency(expenses.filter(e => {
                        const expenseDate = new Date(e.createdAt);
                        const lastMonth = new Date();
                        lastMonth.setMonth(lastMonth.getMonth() - 1);
                        return expenseDate.getMonth() === lastMonth.getMonth() && 
                               expenseDate.getFullYear() === lastMonth.getFullYear();
                      }).reduce((sum, e) => sum + e.amount, 0))}
                    </span>
                  </div>

                  {/* High Value Expenses */}
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-[#0B3558]">High Value (&gt;$500)</p>
                      <p className="text-xs text-[#476788]">
                        {expenses.filter(e => e.amount > 500).length} expenses
                      </p>
                    </div>
                    <span className="text-sm font-bold text-[#0B3558]">
                      {formatCurrency(expenses.filter(e => e.amount > 500).reduce((sum, e) => sum + e.amount, 0))}
                    </span>
                  </div>
                </div>
              </div>

              {/* Payment Patterns */}
              <div className="card p-4 sm:p-6">
                <h3 className="text-lg font-semibold text-[#0B3558] mb-4">Payment Patterns</h3>
                <div className="space-y-4">
                  {/* Frequency Analysis */}
                  {Object.entries(
                    expenses.reduce((acc, expense) => {
                      acc[expense.expenseType] = (acc[expense.expenseType] || 0) + 1;
                      return acc;
                    }, {} as Record<string, number>)
                  )
                    .sort(([,a], [,b]) => b - a)
                    .slice(0, 4)
                    .map(([type, count]) => (
                      <div key={type} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="text-sm font-medium text-[#0B3558] capitalize">{type.replace('_', ' ')}</p>
                          <p className="text-xs text-[#476788]">
                            {((count / expenses.length) * 100).toFixed(1)}% of expenses
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-bold text-[#0B3558]">{count}</span>
                          <p className="text-xs text-[#476788]">
                            {formatCurrency(expenses.filter(e => e.expenseType === type).reduce((sum, e) => sum + e.amount, 0))}
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>

            {/* Expense Efficiency Metrics */}
            <div className="card p-4 sm:p-6">
              <h3 className="text-lg font-semibold text-[#0B3558] mb-4">Expense Insights</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">
                    {expenses.length > 0 ? (totalExpenseAmount / expenses.length).toFixed(0) : '0'}
                  </p>
                  <p className="text-xs text-[#476788]">Average per Expense</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">
                    {expenses.length > 0 ? Math.max(...expenses.map(e => e.amount)).toFixed(0) : '0'}
                  </p>
                  <p className="text-xs text-[#476788]">Highest Expense</p>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <p className="text-2xl font-bold text-purple-600">
                    {expenses.filter(e => e.nextBillingDate && new Date(e.nextBillingDate) > new Date()).length}
                  </p>
                  <p className="text-xs text-[#476788]">Upcoming Bills</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "payments" && (
          <div className="space-y-4 sm:space-y-6">
            {/* Payments Overview */}
            <div className="card p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-[#0B3558]">
                  Payment History
                </h3>
                <div className="text-sm text-[#476788]">
                  {payments.length} payments recorded
                </div>
              </div>

              {payments.length === 0 ? (
                <div className="text-center py-8">
                  <DollarSign className="w-12 h-12 text-[#A6BBD1] mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-[#0B3558] mb-2">
                    No payments recorded
                  </h3>
                  <p className="text-[#476788]">
                    Payment history for this company will appear here
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {payments.map((payment) => (
                    <div
                      key={payment._id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          payment.type === "debt_payment" 
                            ? "bg-red-100" 
                            : "bg-green-100"
                        }`}>
                          <DollarSign className={`w-5 h-5 ${
                            payment.type === "debt_payment" 
                              ? "text-red-600" 
                              : "text-green-600"
                          }`} />
                        </div>
                        <div>
                          <p className="font-medium text-[#0B3558]">
                            {payment.type === "debt_payment" ? "Debt Payment" : "Income Received"}
                          </p>
                          <p className="text-sm text-[#476788]">
                            {payment.description || payment.category}
                          </p>
                          <p className="text-xs text-[#476788]">
                            {new Date(payment.paymentDate).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-semibold ${
                          payment.type === "debt_payment" 
                            ? "text-red-600" 
                            : "text-green-600"
                        }`}>
                          {payment.type === "debt_payment" ? "-" : "+"}
                          ${payment.amount.toFixed(2)}
                        </p>
                        {payment.paymentMethod && (
                          <p className="text-xs text-[#476788]">
                            {payment.paymentMethod.name}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Payment Summary */}
            {payments.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                <div className="card p-4 sm:p-6">
                  <div className="flex items-center">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-lg flex items-center justify-center mr-3 sm:mr-4">
                      <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm font-medium text-[#476788]">
                        Total Income
                      </p>
                      <p className="text-lg sm:text-xl font-bold text-green-600">
                        ${payments
                          .filter(p => p.type === "income_received")
                          .reduce((sum, p) => sum + p.amount, 0)
                          .toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="card p-4 sm:p-6">
                  <div className="flex items-center">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-100 rounded-lg flex items-center justify-center mr-3 sm:mr-4">
                      <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" />
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm font-medium text-[#476788]">
                        Total Debt Payments
                      </p>
                      <p className="text-lg sm:text-xl font-bold text-red-600">
                        ${payments
                          .filter(p => p.type === "debt_payment")
                          .reduce((sum, p) => sum + p.amount, 0)
                          .toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="card p-4 sm:p-6">
                  <div className="flex items-center">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-3 sm:mr-4">
                      <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm font-medium text-[#476788]">
                        This Month
                      </p>
                      <p className="text-lg sm:text-xl font-bold text-[#0B3558]">
                        {payments.filter(p => {
                          const paymentDate = new Date(p.paymentDate);
                          const now = new Date();
                          return paymentDate.getMonth() === now.getMonth() && 
                                 paymentDate.getFullYear() === now.getFullYear();
                        }).length}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Modals */}
      {showCompanyModal && (
        <CompanyModal
          isOpen={showCompanyModal}
          onClose={() => setShowCompanyModal(false)}
          company={company}
          onSuccess={handleCompanyUpdated}
        />
      )}

      {showExpenseModal && (
        <ExpenseModal
          isOpen={showExpenseModal}
          onClose={() => {
            setShowExpenseModal(false);
            setSelectedExpense(undefined);
          }}
          companies={company ? [company] : []}
          expense={selectedExpense}
          onSuccess={handleExpenseCreated}
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
