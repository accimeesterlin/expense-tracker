"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Building2, MapPin, Mail, Globe, Hash } from "lucide-react";
import Link from "next/link";

interface Company {
  _id: string;
  name: string;
  industry?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  contactInfo?: {
    email?: string;
    phone?: string;
    website?: string;
  };
  taxId?: string;
}

const industries = [
  "Technology",
  "Healthcare",
  "Finance",
  "Retail",
  "Manufacturing",
  "Education",
  "Real Estate",
  "Consulting",
  "Marketing",
  "Legal",
  "Other",
];

const states = [
  "AL",
  "AK",
  "AZ",
  "AR",
  "CA",
  "CO",
  "CT",
  "DE",
  "FL",
  "GA",
  "HI",
  "ID",
  "IL",
  "IN",
  "IA",
  "KS",
  "KY",
  "LA",
  "ME",
  "MD",
  "MA",
  "MI",
  "MN",
  "MS",
  "MO",
  "MT",
  "NE",
  "NV",
  "NH",
  "NJ",
  "NM",
  "NY",
  "NC",
  "ND",
  "OH",
  "OK",
  "OR",
  "PA",
  "RI",
  "SC",
  "SD",
  "TN",
  "TX",
  "UT",
  "VT",
  "VA",
  "WA",
  "WV",
  "WI",
  "WY",
];

export default function CompanySettingsPage() {
  const { status } = useSession();
  const router = useRouter();
  const params = useParams();
  const companyId = params.id as string;

  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    industry: "",
    address: {
      street: "",
      city: "",
      state: "",
      zipCode: "",
      country: "United States",
    },
    contactInfo: {
      email: "",
      phone: "",
      website: "",
    },
    taxId: "",
  });

  const fetchCompany = useCallback(async () => {
    try {
      const response = await fetch(`/api/companies/${companyId}`);
      if (response.ok) {
        const data = await response.json();
        setCompany(data);
        setFormData({
          name: data.name || "",
          industry: data.industry || "",
          address: {
            street: data.address?.street || "",
            city: data.address?.city || "",
            state: data.address?.state || "",
            zipCode: data.address?.zipCode || "",
            country: data.address?.country || "United States",
          },
          contactInfo: {
            email: data.contactInfo?.email || "",
            phone: data.contactInfo?.phone || "",
            website: data.contactInfo?.website || "",
          },
          taxId: data.taxId || "",
        });
      } else {
        setError("Company not found");
      }
    } catch (error) {
      setError("Failed to load company data");
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated") {
      router.push("/auth/signin");
      return;
    }
    fetchCompany();
  }, [status, router, companyId, fetchCompany]);

  const handleInputChange = (
    field: string,
    value: string,
    subfield?: string
  ) => {
    if (subfield) {
      setFormData((prev) => ({
        ...prev,
        [field]: {
          ...((prev[field as keyof typeof prev] as Record<string, string>) || {}),
          [subfield]: value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      setError("Company name is required");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(`/api/companies/${companyId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const updatedCompany = await response.json();
        setCompany(updatedCompany);
        setSuccess("Company settings updated successfully!");
        setTimeout(() => setSuccess(""), 3000);
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to update company");
      }
    } catch (error) {
      setError("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-[#F8F9FB] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#006BFF]"></div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return null;
  }

  if (!company) {
    return (
      <div className="min-h-screen bg-[#F8F9FB] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-[#0B3558] mb-2">
            Company Not Found
          </h2>
          <Link href="/" className="text-[#006BFF] hover:underline">
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FB]">
      {/* Header */}
      <div className="bg-white border-b border-[#E5E7EB]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link
                href="/"
                className="p-2 rounded-lg hover:bg-[#F8F9FB] transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-[#476788]" />
              </Link>
              <div className="flex items-center space-x-3">
                <Building2 className="w-6 h-6 text-[#006BFF]" />
                <h1 className="text-2xl font-semibold text-[#0B3558]">
                  {company.name} Settings
                </h1>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="card">
          <div className="p-6 border-b border-[#E5E7EB]">
            <h2 className="text-lg font-semibold text-[#0B3558]">
              Company Details
            </h2>
            <p className="text-sm text-[#476788] mt-1">
              Update your company information and settings
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg text-sm">
                {success}
              </div>
            )}

            {/* Company Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-[#0B3558]">
                Basic Information
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#0B3558] mb-2">
                    Company Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    className="input-field w-full"
                    placeholder="Enter company name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#0B3558] mb-2">
                    Industry
                  </label>
                  <select
                    value={formData.industry}
                    onChange={(e) =>
                      handleInputChange("industry", e.target.value)
                    }
                    className="input-field w-full"
                  >
                    <option value="">Select industry</option>
                    {industries.map((industry) => (
                      <option key={industry} value={industry}>
                        {industry}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Address */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-[#0B3558] flex items-center space-x-2">
                <MapPin className="w-5 h-5 text-[#476788]" />
                <span>Address</span>
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#0B3558] mb-2">
                    Street Address
                  </label>
                  <input
                    type="text"
                    value={formData.address.street}
                    onChange={(e) =>
                      handleInputChange("address", e.target.value, "street")
                    }
                    className="input-field w-full"
                    placeholder="Enter street address"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#0B3558] mb-2">
                      City
                    </label>
                    <input
                      type="text"
                      value={formData.address.city}
                      onChange={(e) =>
                        handleInputChange("address", e.target.value, "city")
                      }
                      className="input-field w-full"
                      placeholder="Enter city"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#0B3558] mb-2">
                      State
                    </label>
                    <select
                      value={formData.address.state}
                      onChange={(e) =>
                        handleInputChange("address", e.target.value, "state")
                      }
                      className="input-field w-full"
                    >
                      <option value="">Select state</option>
                      {states.map((state) => (
                        <option key={state} value={state}>
                          {state}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#0B3558] mb-2">
                      ZIP Code
                    </label>
                    <input
                      type="text"
                      value={formData.address.zipCode}
                      onChange={(e) =>
                        handleInputChange("address", e.target.value, "zipCode")
                      }
                      className="input-field w-full"
                      placeholder="Enter ZIP code"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-[#0B3558] flex items-center space-x-2">
                <Mail className="w-5 h-5 text-[#476788]" />
                <span>Contact Information</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#0B3558] mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.contactInfo.email}
                    onChange={(e) =>
                      handleInputChange("contactInfo", e.target.value, "email")
                    }
                    className="input-field w-full"
                    placeholder="Enter email address"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#0B3558] mb-2">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={formData.contactInfo.phone}
                    onChange={(e) =>
                      handleInputChange("contactInfo", e.target.value, "phone")
                    }
                    className="input-field w-full"
                    placeholder="Enter phone number"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#0B3558] mb-2">
                  Website
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Globe className="h-5 w-5 text-[#476788]" />
                  </div>
                  <input
                    type="url"
                    value={formData.contactInfo.website}
                    onChange={(e) =>
                      handleInputChange(
                        "contactInfo",
                        e.target.value,
                        "website"
                      )
                    }
                    className="input-field w-full pl-12"
                    placeholder="https://example.com"
                  />
                </div>
              </div>
            </div>

            {/* Tax Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-[#0B3558] flex items-center space-x-2">
                <Hash className="w-5 h-5 text-[#476788]" />
                <span>Tax Information</span>
              </h3>

              <div>
                <label className="block text-sm font-medium text-[#0B3558] mb-2">
                  Tax ID (EIN)
                </label>
                <input
                  type="text"
                  value={formData.taxId}
                  onChange={(e) => handleInputChange("taxId", e.target.value)}
                  className="input-field w-full"
                  placeholder="XX-XXXXXXX"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end space-x-3 pt-6 border-t border-[#E5E7EB]">
              <Link href="/" className="btn-secondary">
                Cancel
              </Link>
              <button
                type="submit"
                disabled={saving}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
