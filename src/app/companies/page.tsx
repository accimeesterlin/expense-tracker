"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
} from "lucide-react";
import AppLayout from "@/components/AppLayout";
import CompanyModal from "@/components/CompanyModal";

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
  expenseCount?: number;
  teamCount?: number;
}

export default function CompaniesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [filteredCompanies, setFilteredCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);

  const fetchCompanies = async () => {
    try {
      const response = await fetch("/api/companies");
      if (response.ok) {
        const data = await response.json();
        setCompanies(data);
      }
    } catch (error) {
      console.error("Error fetching companies:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterCompanies = useCallback(() => {
    const filtered = companies.filter((company) =>
      company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      company.industry.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredCompanies(filtered);
  }, [companies, searchTerm]);

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/auth/signin");
      return;
    }
    fetchCompanies();
  }, [session, status, router]);

  useEffect(() => {
    filterCompanies();
  }, [filterCompanies]);

  const handleCompanyCreated = (newCompany: Company) => {
    if (selectedCompany) {
      // Update existing company
      setCompanies((prev) =>
        prev.map((c) => (c._id === newCompany._id ? newCompany : c))
      );
    } else {
      // Add new company
      setCompanies((prev) => [newCompany, ...prev]);
    }
    setShowCompanyModal(false);
    setSelectedCompany(null);
  };

  const handleDeleteCompany = async (companyId: string) => {
    if (!confirm("Are you sure you want to delete this company? This will also delete all associated expenses.")) {
      return;
    }

    try {
      const response = await fetch(`/api/companies/${companyId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setCompanies((prev) => prev.filter((c) => c._id !== companyId));
      } else {
        const errorData = await response.json();
        alert(errorData.error || "Failed to delete company");
      }
    } catch (error) {
      console.error("Error deleting company:", error);
      alert("Failed to delete company. Please try again.");
    }
  };

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
    <AppLayout title="Companies">
      {/* Page Header */}
      <div className="bg-white border-b border-[#E5E7EB] -m-6 mb-6">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <Building2 className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-[#0B3558]">
                  Companies
                </h1>
                <p className="text-sm text-[#476788]">
                  Manage your business partners
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowCompanyModal(true)}
              className="btn-primary inline-flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add Company</span>
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                <Building2 className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-[#476788]">Total Companies</p>
                <p className="text-2xl font-bold text-[#0B3558]">
                  {companies.length}
                </p>
              </div>
            </div>
          </div>
          <div className="card p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                <CreditCard className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-[#476788]">Active Expenses</p>
                <p className="text-2xl font-bold text-[#0B3558]">
                  {companies.reduce((sum, c) => sum + (c.expenseCount || 0), 0)}
                </p>
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
                <p className="text-2xl font-bold text-[#0B3558]">
                  {companies.reduce((sum, c) => sum + (c.teamCount || 0), 0)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="card p-6">
          <div className="relative">
            <Search className="w-5 h-5 text-[#476788] absolute left-4 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search companies..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-12 w-full"
            />
          </div>
        </div>

        {/* Companies List */}
        {filteredCompanies.length === 0 ? (
          <div className="card p-12 text-center">
            <Building2 className="w-16 h-16 text-[#A6BBD1] mx-auto mb-8" />
            <h3 className="text-lg font-medium text-[#0B3558] mb-2">
              {companies.length === 0 ? "No companies yet" : "No companies match your search"}
            </h3>
            <p className="text-[#476788] mb-6">
              {companies.length === 0
                ? "Start by adding your first business partner or vendor"
                : "Try adjusting your search terms"}
            </p>
            <button
              onClick={() => setShowCompanyModal(true)}
              className="btn-primary inline-flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add Your First Company</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCompanies.map((company) => (
              <div key={company._id} className="card p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <Link
                      href={`/companies/${company._id}`}
                      className="block hover:text-[#006BFF] transition-colors"
                    >
                      <h3 className="text-lg font-semibold text-[#0B3558] mb-1">
                        {company.name}
                      </h3>
                      <p className="text-sm text-[#006BFF] font-medium">
                        {company.industry}
                      </p>
                    </Link>
                  </div>
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => {
                        setSelectedCompany(company);
                        setShowCompanyModal(true);
                      }}
                      className="p-2 text-[#476788] hover:text-[#006BFF] hover:bg-[#006BFF]/10 rounded-lg transition-colors"
                      title="Edit company"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteCompany(company._id)}
                      className="p-2 text-[#476788] hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete company"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2 text-sm text-[#476788]">
                  {company.address?.city && company.address?.state && (
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-4 h-4" />
                      <span>{company.address.city}, {company.address.state}</span>
                    </div>
                  )}
                  {company.contactInfo?.email && (
                    <div className="flex items-center space-x-2">
                      <Mail className="w-4 h-4" />
                      <span>{company.contactInfo.email}</span>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t border-[#E5E7EB]">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-1 text-[#476788]">
                        <CreditCard className="w-4 h-4" />
                        <span>{company.expenseCount || 0} expenses</span>
                      </div>
                      <div className="flex items-center space-x-1 text-[#476788]">
                        <Users className="w-4 h-4" />
                        <span>{company.teamCount || 0} team</span>
                      </div>
                    </div>
                    <Link
                      href={`/companies/${company._id}`}
                      className="text-[#006BFF] hover:text-[#0052CC] font-medium"
                    >
                      View Details →
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {showCompanyModal && (
        <CompanyModal
          isOpen={showCompanyModal}
          onClose={() => {
            setShowCompanyModal(false);
            setSelectedCompany(null);
          }}
          company={selectedCompany}
          onSuccess={handleCompanyCreated}
        />
      )}
    </AppLayout>
  );
}