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
    const filtered = companies.filter(
      (company) =>
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
    if (
      !confirm(
        "Are you sure you want to delete this company? This will also delete all associated expenses."
      )
    ) {
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
      <div className="bg-white border-b border-[#E5E7EB] -m-3 sm:-m-4 lg:-m-6 mb-3 sm:mb-4 lg:mb-6 w-full overflow-x-hidden">
        <div className="w-full px-3 sm:px-4 lg:px-6 py-3 sm:py-4 lg:py-6 overflow-x-hidden">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-3 w-full">
            <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
              <div className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Building2 className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 text-blue-600" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-base sm:text-lg lg:text-xl font-semibold text-[#0B3558] truncate">
                  Companies
                </h1>
                <p className="text-xs sm:text-sm text-[#476788] truncate">
                  Manage your business partners
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowCompanyModal(true)}
              className="btn-primary inline-flex items-center space-x-2 text-xs sm:text-sm lg:text-base w-full sm:w-auto justify-center flex-shrink-0"
            >
              <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
              <span>Add Company</span>
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-4 sm:space-y-6 lg:space-y-8 w-full overflow-x-hidden">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6 w-full">
          <div className="card p-3 sm:p-4 lg:p-6 w-full overflow-hidden">
            <div className="flex items-center w-full">
              <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-2 sm:mr-3 lg:mr-4 flex-shrink-0">
                <Building2 className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-blue-600" />
              </div>
              <div className="min-w-0 flex-1 overflow-hidden">
                <p className="text-xs sm:text-sm font-medium text-[#476788] truncate">
                  Total Companies
                </p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-[#0B3558] truncate">
                  {companies.length}
                </p>
              </div>
            </div>
          </div>
          <div className="card p-3 sm:p-4 lg:p-6">
            <div className="flex items-center">
              <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-green-100 rounded-lg flex items-center justify-center mr-2 sm:mr-3 lg:mr-4 flex-shrink-0">
                <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-green-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-[#476788] truncate">
                  Active Expenses
                </p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-[#0B3558]">
                  {companies.reduce((sum, c) => sum + (c.expenseCount || 0), 0)}
                </p>
              </div>
            </div>
          </div>
          <div className="card p-3 sm:p-4 lg:p-6 sm:col-span-2 lg:col-span-1">
            <div className="flex items-center">
              <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-purple-100 rounded-lg flex items-center justify-center mr-2 sm:mr-3 lg:mr-4 flex-shrink-0">
                <Users className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-purple-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-[#476788] truncate">
                  Team Members
                </p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-[#0B3558]">
                  {companies.reduce((sum, c) => sum + (c.teamCount || 0), 0)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="card p-3 sm:p-4 lg:p-6">
          <div className="input-field-with-icon">
            <Search className="icon w-4 h-4 sm:w-5 sm:h-5" />
            <input
              type="text"
              placeholder="Search companies..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field w-full text-sm sm:text-base"
            />
          </div>
        </div>

        {/* Companies List */}
        {filteredCompanies.length === 0 ? (
          <div className="card p-6 sm:p-8 lg:p-12 text-center">
            <Building2 className="w-10 h-10 sm:w-12 sm:h-12 lg:w-16 lg:h-16 text-[#A6BBD1] mx-auto mb-3 sm:mb-4 lg:mb-8" />
            <h3 className="text-sm sm:text-base lg:text-lg font-medium text-[#0B3558] mb-2">
              {companies.length === 0
                ? "No companies yet"
                : "No companies match your search"}
            </h3>
            <p className="text-xs sm:text-sm lg:text-base text-[#476788] mb-3 sm:mb-4 lg:mb-6">
              {companies.length === 0
                ? "Start by adding your first business partner or vendor"
                : "Try adjusting your search terms"}
            </p>
            <button
              onClick={() => setShowCompanyModal(true)}
              className="btn-primary inline-flex items-center space-x-2 text-xs sm:text-sm lg:text-base"
            >
              <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
              <span>Add Your First Company</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6 w-full">
            {filteredCompanies.map((company) => (
              <div
                key={company._id}
                className="card p-3 sm:p-4 lg:p-6 hover:shadow-lg transition-shadow w-full overflow-hidden"
              >
                <div className="flex items-start justify-between mb-2 sm:mb-3 lg:mb-4">
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/companies/${company._id}`}
                      className="block hover:text-[#006BFF] transition-colors"
                    >
                      <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-[#0B3558] mb-1 truncate">
                        {company.name}
                      </h3>
                      <p className="text-xs sm:text-sm text-[#006BFF] font-medium truncate">
                        {company.industry}
                      </p>
                    </Link>
                  </div>
                  <div className="flex items-center space-x-1 ml-2">
                    <button
                      onClick={() => {
                        setSelectedCompany(company);
                        setShowCompanyModal(true);
                      }}
                      className="p-1.5 sm:p-2 text-[#476788] hover:text-[#006BFF] hover:bg-[#006BFF]/10 rounded-lg transition-colors"
                      title="Edit company"
                    >
                      <Edit className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteCompany(company._id)}
                      className="p-1.5 sm:p-2 text-[#476788] hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete company"
                    >
                      <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-1 sm:space-y-1.5 lg:space-y-2 text-xs sm:text-sm text-[#476788]">
                  {company.address?.city && company.address?.state && (
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-3 h-3 sm:w-3.5 sm:h-3.5 lg:w-4 lg:h-4 flex-shrink-0" />
                      <span className="truncate">
                        {company.address.city}, {company.address.state}
                      </span>
                    </div>
                  )}
                  {company.contactInfo?.email && (
                    <div className="flex items-center space-x-2">
                      <Mail className="w-3 h-3 sm:w-3.5 sm:h-3.5 lg:w-4 lg:h-4 flex-shrink-0" />
                      <span className="truncate">
                        {company.contactInfo.email}
                      </span>
                    </div>
                  )}
                </div>

                <div className="mt-2 sm:mt-3 lg:mt-4 pt-2 sm:pt-3 lg:pt-4 border-t border-[#E5E7EB]">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2 lg:gap-0 text-xs sm:text-sm">
                    <div className="flex items-center space-x-2 sm:space-x-3 lg:space-x-4">
                      <div className="flex items-center space-x-1 text-[#476788]">
                        <CreditCard className="w-3 h-3 sm:w-3.5 sm:h-3.5 lg:w-4 lg:h-4" />
                        <span>{company.expenseCount || 0} expenses</span>
                      </div>
                      <div className="flex items-center space-x-1 text-[#476788]">
                        <Users className="w-3 h-3 sm:w-3.5 sm:h-3.5 lg:w-4 lg:h-4" />
                        <span>{company.teamCount || 0} team</span>
                      </div>
                    </div>
                    <Link
                      href={`/companies/${company._id}`}
                      className="text-[#006BFF] hover:text-[#0052CC] font-medium text-xs sm:text-sm whitespace-nowrap"
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
