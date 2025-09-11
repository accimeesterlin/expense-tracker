"use client";

import { useState, useEffect } from "react";
import { X, Users } from "lucide-react";

interface Company {
  _id: string;
  name: string;
}

interface TeamMember {
  _id: string;
  name: string;
  email: string;
  role: string;
  department?: string;
  phone?: string;
  isActive: boolean;
  company: Company;
}

interface TeamMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  companies: Company[];
  teamMember?: TeamMember;
  onSuccess: (teamMember: TeamMember) => void;
}

export default function TeamMemberModal({
  isOpen,
  onClose,
  companies,
  teamMember,
  onSuccess,
}: TeamMemberModalProps) {
  const isEditing = !!teamMember;
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "",
    department: "",
    phone: "",
    company: "",
    isActive: true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const hasCompanies = companies.length > 0;

  useEffect(() => {
    if (teamMember) {
      // Pre-fill form for editing
      setFormData({
        name: teamMember.name,
        email: teamMember.email,
        role: teamMember.role,
        department: teamMember.department || "",
        phone: teamMember.phone || "",
        company: teamMember.company._id,
        isActive: teamMember.isActive,
      });
    } else if (hasCompanies && !formData.company) {
      // Set first company as default for new team members
      setFormData((prev) => ({ ...prev, company: companies[0]._id }));
    }
  }, [teamMember, companies, hasCompanies, formData.company]);

  const resetForm = () => {
    if (!teamMember) {
      setFormData({
        name: "",
        email: "",
        role: "",
        department: "",
        phone: "",
        company: hasCompanies ? companies[0]._id : "",
        isActive: true,
      });
    }
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!hasCompanies) {
      setError("Please create a company first before adding team members");
      return;
    }

    if (!formData.name.trim()) {
      setError("Name is required");
      return;
    }

    if (!formData.email.trim()) {
      setError("Email is required");
      return;
    }

    if (!formData.role.trim()) {
      setError("Role is required");
      return;
    }

    if (!formData.company) {
      setError("Company is required");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const url = teamMember ? `/api/team-members/${teamMember._id}` : "/api/team-members";
      const method = teamMember ? "PUT" : "POST";

      const memberData = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        role: formData.role.trim(),
        department: formData.department.trim() || undefined,
        phone: formData.phone.trim() || undefined,
        company: formData.company,
        isActive: formData.isActive,
      };

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(memberData),
      });

      if (response.ok) {
        const result = await response.json();
        onSuccess(result);
        resetForm();
        onClose();
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to save team member");
      }
    } catch (error) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="card max-w-md w-full my-8 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#E5E7EB]">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-[#006BFF] rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-semibold text-[#0B3558]">
              {isEditing ? "Edit Team Member" : "Add New Team Member"}
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

          {!hasCompanies ? (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg text-sm">
              You need to create a company first before adding team members.
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#0B3558] mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="input-field w-full"
                    placeholder="Enter full name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#0B3558] mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="input-field w-full"
                    placeholder="Enter email address"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#0B3558] mb-2">
                    Role
                  </label>
                  <input
                    type="text"
                    value={formData.role}
                    onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                    className="input-field w-full"
                    placeholder="e.g., Software Developer"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#0B3558] mb-2">
                    Company
                  </label>
                  <select
                    value={formData.company}
                    onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
                    className="input-field w-full"
                    required
                  >
                    <option value="">Select company</option>
                    {companies.map((company) => (
                      <option key={company._id} value={company._id}>
                        {company.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#0B3558] mb-2">
                    Department (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.department}
                    onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
                    className="input-field w-full"
                    placeholder="e.g., Engineering"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#0B3558] mb-2">
                    Phone (Optional)
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    className="input-field w-full"
                    placeholder="Enter phone number"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                  className="rounded border-[#E5E7EB] text-[#006BFF] focus:ring-[#006BFF]"
                />
                <label htmlFor="isActive" className="text-sm font-medium text-[#0B3558]">
                  Active team member
                </label>
              </div>
            </>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-4">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !hasCompanies}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading 
                ? "Saving..." 
                : isEditing 
                ? "Update Team Member" 
                : "Add Team Member"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}