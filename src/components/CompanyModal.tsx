"use client";

import { useState, useEffect } from "react";
import { X, Building2 } from "lucide-react";
import { useBrandfetch, BrandfetchSearchResult } from "@/hooks/useBrandfetch";
import CompanyAutocomplete from "./CompanyAutocomplete";

interface Company {
  _id: string;
  name: string;
  industry: string;
  description?: string;
  domain?: string;
  brandId?: string;
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

interface CompanyModalProps {
  isOpen: boolean;
  onClose: () => void;
  company?: Company | null;
  onSuccess: (company: Company) => void;
}

export default function CompanyModal({
  isOpen,
  onClose,
  company,
  onSuccess,
}: CompanyModalProps) {
  const [name, setName] = useState("");
  const [domain, setDomain] = useState("");
  const [brandId, setBrandId] = useState("");
  const [selectedCompany, setSelectedCompany] = useState<BrandfetchSearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const { getCompanyIcon } = useBrandfetch();

  useEffect(() => {
    if (company) {
      setName(company.name);
      setDomain(company.domain || "");
      setBrandId(company.brandId || "");
    } else {
      setName("");
      setDomain("");
      setBrandId("");
      setSelectedCompany(null);
    }
    setError("");
  }, [company]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setError("Company name is required");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const url = company ? `/api/companies/${company._id}` : "/api/companies";
      const method = company ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          name: name.trim(),
          domain: domain.trim() || undefined,
          brandId: brandId.trim() || undefined,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        onSuccess(result);
        setName("");
        setDomain("");
        setBrandId("");
        setSelectedCompany(null);
        onClose();
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to save company");
      }
    } catch (error) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="card max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#E5E7EB]">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-[#006BFF] rounded-lg flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-semibold text-[#0B3558]">
              {company ? "Edit Company" : "Add New Company"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[#476788] hover:text-[#0B3558] hover:bg-[#F8F9FB] rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-[#0B3558] mb-2">
              Company Name
            </label>
            <CompanyAutocomplete
              value={name}
              onChange={(value, companyData) => {
                setName(value);
                if (companyData) {
                  setSelectedCompany(companyData);
                  setDomain(companyData.domain);
                  setBrandId(companyData.brandId);
                }
              }}
              placeholder="Search for a company name"
              className="w-full"
              showLogo={true}
            />
            {selectedCompany && (
              <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center space-x-3">
                  <img
                    src={selectedCompany.icon}
                    alt={`${selectedCompany.name} logo`}
                    className="w-8 h-8 rounded object-contain"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = "none";
                    }}
                  />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-green-800">
                      Company found: {selectedCompany.name}
                    </div>
                    <div className="text-xs text-green-600">
                      Domain: {selectedCompany.domain}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCompany(null);
                      setDomain("");
                      setBrandId("");
                    }}
                    className="text-green-600 hover:text-green-700 text-xs"
                  >
                    ✕
                  </button>
                </div>
              </div>
            )}
          </div>

          <p className="text-xs text-[#476788]">
            You can add more details like address and contact information later
            in company settings.
          </p>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-4">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading
                ? "Saving..."
                : company
                ? "Update Company"
                : "Create Company"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
