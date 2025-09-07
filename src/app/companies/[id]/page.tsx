"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import {
  Building2,
  Plus,
  Search,
  Edit,
  Trash2,
  ArrowLeft,
  MapPin,
  Mail,
  Users,
  CreditCard,
  Calendar,
  DollarSign,
  Filter,
} from "lucide-react";
import AppLayout from "@/components/AppLayout";
import CompanyModal from "@/components/CompanyModal";
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
  amount: number;
  category: string;
  expenseType: string;
  nextBillingDate?: string;
  company: Company;
  isActive: boolean;
  createdAt: string;
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
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"expenses" | "team" | "overview">("overview");
  const [mounted, setMounted] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [expenseFilter, setExpenseFilter] = useState<string>("all");
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);

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
  }, [session, status, router, companyId]);

  useEffect(() => {
    filterExpenses();
  }, [expenses, searchTerm, expenseFilter]);

  const fetchCompanyDetails = async () => {
    try {
      const [companyRes, expensesRes, teamRes] = await Promise.all([
        fetch(`/api/companies/${companyId}`),
        fetch(`/api/expenses?companyId=${companyId}`),
        fetch(`/api/team-members?companyId=${companyId}`),
      ]);

      if (companyRes.ok) {
        const companyData = await companyRes.json();
        setCompany(companyData);
      }

      if (expensesRes.ok) {
        const expensesData = await expensesRes.json();
        setExpenses(expensesData);
      }

      if (teamRes.ok) {
        const teamData = await teamRes.json();
        setTeamMembers(teamData);
      }
    } catch (error) {
      console.error("Error fetching company details:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterExpenses = () => {
    let filtered = expenses.filter((expense) => {
      const matchesSearch = expense.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        expense.category.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = expenseFilter === "all" || 
        (expenseFilter === "active" && expense.isActive) ||
        (expenseFilter === "inactive" && !expense.isActive) ||
        expense.expenseType === expenseFilter;
      return matchesSearch && matchesFilter;
    });
    setFilteredExpenses(filtered);
  };

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
    setSelectedExpense(null);
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const totalExpenseAmount = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const activeExpenses = expenses.filter(e => e.isActive).length;
  const monthlyRecurring = expenses.filter(e => e.expenseType === "subscription" && e.isActive).reduce((sum, e) => sum + e.amount, 0);

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
    <AppLayout title={`${company?.name || 'Company'} Details`}>
      {/* Company Header */}
      <div className="bg-white border-b border-[#E5E7EB] mb-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Building2 className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-[#0B3558]">
                  {company.name}
                </h1>
                <p className="text-sm text-[#476788]">{company.industry}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowExpenseModal(true)}
                className="btn-secondary inline-flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Add Expense</span>
              </button>
              <button
                onClick={() => setShowCompanyModal(true)}
                className="btn-primary inline-flex items-center space-x-2"
              >
                <Edit className="w-4 h-4" />
                <span>Edit Company</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white border-b border-[#E5E7EB]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {["overview", "expenses", "team"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm capitalize ${
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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === "overview" && (
          <div className="space-y-8">
            {/* Company Info */}
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-[#0B3558] mb-4">Company Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-[#476788]">Industry</label>
                    <p className="text-[#0B3558]">{company.industry}</p>
                  </div>
                  {company.description && (
                    <div>
                      <label className="text-sm font-medium text-[#476788]">Description</label>
                      <p className="text-[#0B3558]">{company.description}</p>
                    </div>
                  )}
                  <div>
                    <label className="text-sm font-medium text-[#476788]">Member Since</label>
                    <p className="text-[#0B3558]">{formatDate(company.createdAt)}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-[#476788]">Address</label>
                    <div className="text-[#0B3558]">
                      {company.address.street && <p>{company.address.street}</p>}
                      <p>{company.address.city}, {company.address.state} {company.address.zipCode}</p>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-[#476788]">Contact</label>
                    <div className="text-[#0B3558] space-y-1">
                      <div className="flex items-center space-x-2">
                        <Mail className="w-4 h-4 text-[#476788]" />
                        <span>{company.contactInfo.email}</span>
                      </div>
                      {company.contactInfo.phone && (
                        <div className="flex items-center space-x-2">
                          <span className="w-4 h-4 text-center text-[#476788]">📞</span>
                          <span>{company.contactInfo.phone}</span>
                        </div>
                      )}
                      {company.contactInfo.website && (
                        <div className="flex items-center space-x-2">
                          <span className="w-4 h-4 text-center text-[#476788]">🌐</span>
                          <a href={company.contactInfo.website} target="_blank" rel="noopener noreferrer" className="text-[#006BFF] hover:underline">
                            {company.contactInfo.website}
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="card p-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                    <CreditCard className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#476788]">Total Expenses</p>
                    <p className="text-xl font-bold text-[#0B3558]">{expenses.length}</p>
                  </div>
                </div>
              </div>
              <div className="card p-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                    <DollarSign className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#476788]">Total Amount</p>
                    <p className="text-xl font-bold text-[#0B3558]">{formatCurrency(totalExpenseAmount)}</p>
                  </div>
                </div>
              </div>
              <div className="card p-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mr-4">
                    <Calendar className="w-6 h-6 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#476788]">Active Expenses</p>
                    <p className="text-xl font-bold text-[#0B3558]">{activeExpenses}</p>
                  </div>
                </div>
              </div>
              <div className="card p-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mr-4">
                    <Users className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#476788]">Team Members</p>
                    <p className="text-xl font-bold text-[#0B3558]">{teamMembers.length}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "expenses" && (
          <div className="space-y-6">
            {/* Filters */}
            <div className="card p-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="w-5 h-5 text-[#476788] absolute left-3 top-1/2 transform -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search expenses..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="input-field pl-12"
                    />
                  </div>
                </div>
                <select
                  value={expenseFilter}
                  onChange={(e) => setExpenseFilter(e.target.value)}
                  className="input-field"
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
              <div className="card p-12 text-center">
                <CreditCard className="w-16 h-16 text-[#A6BBD1] mx-auto mb-8" />
                <h3 className="text-lg font-medium text-[#0B3558] mb-2">
                  {expenses.length === 0 ? "No expenses yet" : "No expenses match your filters"}
                </h3>
                <p className="text-[#476788] mb-6">
                  {expenses.length === 0
                    ? "Start tracking expenses for this company"
                    : "Try adjusting your search or filters"}
                </p>
                <button
                  onClick={() => setShowExpenseModal(true)}
                  className="btn-primary inline-flex items-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add First Expense</span>
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
        )}

        {activeTab === "team" && (
          <div className="space-y-6">
            {teamMembers.length === 0 ? (
              <div className="card p-12 text-center">
                <Users className="w-16 h-16 text-[#A6BBD1] mx-auto mb-8" />
                <h3 className="text-lg font-medium text-[#0B3558] mb-2">
                  No team members yet
                </h3>
                <p className="text-[#476788] mb-6">
                  Add team members to collaborate on this company
                </p>
                <button className="btn-primary inline-flex items-center space-x-2">
                  <Plus className="w-4 h-4" />
                  <span>Add Team Member</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {teamMembers.map((member) => (
                  <div key={member._id} className="card p-6">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="w-12 h-12 bg-[#006BFF]/10 rounded-full flex items-center justify-center">
                        <User className="w-6 h-6 text-[#006BFF]" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-[#0B3558]">{member.name}</h3>
                        <p className="text-sm text-[#476788]">{member.role}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-[#476788]">
                      <Mail className="w-4 h-4" />
                      <span>{member.email}</span>
                    </div>
                  </div>
                ))}
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
            setSelectedExpense(null);
          }}
          companies={company ? [company] : []}
          expense={selectedExpense}
          onSuccess={handleExpenseCreated}
        />
      )}
    </AppLayout>
  );
}