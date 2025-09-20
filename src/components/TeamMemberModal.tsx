"use client";

import { useState, useEffect, useMemo } from "react";
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
  const [sendInvite, setSendInvite] = useState(true);
  const [permissions, setPermissions] = useState<string[]>(['view_expenses', 'create_expenses']);

  // Role-based permission mappings (memoized to prevent recreation)
  const rolePermissions = useMemo(() => ({
    'Manager': ['view_expenses', 'create_expenses', 'edit_expenses', 'delete_expenses', 'view_budgets', 'create_budgets', 'edit_budgets', 'view_analytics', 'manage_team'],
    'Team Lead': ['view_expenses', 'create_expenses', 'edit_expenses', 'view_budgets', 'create_budgets', 'view_analytics', 'manage_team'],
    'Senior Developer': ['view_expenses', 'create_expenses', 'edit_expenses', 'view_budgets', 'view_analytics'],
    'Developer': ['view_expenses', 'create_expenses', 'edit_expenses', 'view_budgets'],
    'Junior Developer': ['view_expenses', 'create_expenses'],
    'Designer': ['view_expenses', 'create_expenses', 'view_budgets'],
    'Product Manager': ['view_expenses', 'create_expenses', 'edit_expenses', 'view_budgets', 'create_budgets', 'view_analytics'],
    'Business Analyst': ['view_expenses', 'create_expenses', 'view_budgets', 'view_analytics'],
    'QA Engineer': ['view_expenses', 'create_expenses'],
    'DevOps Engineer': ['view_expenses', 'create_expenses', 'edit_expenses'],
    'Data Analyst': ['view_expenses', 'view_budgets', 'view_analytics'],
    'Marketing Specialist': ['view_expenses', 'create_expenses', 'view_budgets'],
    'Sales Representative': ['view_expenses', 'create_expenses'],
    'Customer Support': ['view_expenses'],
    'HR Specialist': ['view_expenses', 'view_budgets', 'manage_team'],
    'Finance Manager': ['view_expenses', 'create_expenses', 'edit_expenses', 'delete_expenses', 'view_budgets', 'create_budgets', 'edit_budgets', 'delete_budgets', 'view_analytics', 'admin_access'],
    'Operations Manager': ['view_expenses', 'create_expenses', 'edit_expenses', 'view_budgets', 'create_budgets', 'view_analytics', 'manage_team'],
    'Consultant': ['view_expenses', 'create_expenses', 'view_budgets', 'view_analytics'],
    'Intern': ['view_expenses'],
    'Contractor': ['view_expenses', 'create_expenses'],
  }), []);

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
      setSendInvite(false); // Don't send invite when editing
    } else if (hasCompanies && !formData.company) {
      // Set first company as default for new team members
      setFormData((prev) => ({ ...prev, company: companies[0]._id }));
      setSendInvite(true); // Send invite for new members
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

    if (!sendInvite && !formData.name.trim()) {
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
      if (!teamMember && sendInvite) {
        // Send invitation
        const inviteData = {
          email: formData.email.trim(),
          companyId: formData.company,
          role: formData.role.trim(),
          department: formData.department.trim() || undefined,
          phone: formData.phone.trim() || undefined,
          permissions: permissions,
        };

        const response = await fetch("/api/team-invites", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(inviteData),
        });

        if (response.ok) {
          const result = await response.json();
          resetForm();
          onClose();
          
          // Show success message with invite URL if available
          if (result.inviteUrl) {
            alert(`Invitation created! Since email service is not configured, share this invitation link:\n\n${result.inviteUrl}`);
          } else {
            alert("Invitation sent successfully!");
          }
        } else {
          const errorData = await response.json();
          setError(errorData.error || "Failed to send invitation");
        }
      } else {
        // Create or update team member directly
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
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
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
                {(!sendInvite || teamMember) && (
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
                )}

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
                  <select
                    value={formData.role}
                    onChange={(e) => {
                      const newRole = e.target.value;
                      setFormData(prev => ({ ...prev, role: newRole }));
                      
                      // Auto-select permissions for predefined roles
                      if (newRole && rolePermissions[newRole]) {
                        setPermissions(rolePermissions[newRole]);
                      }
                    }}
                    className="input-field w-full"
                    required
                  >
                    <option value="">Select a role</option>
                    <option value="Manager">Manager</option>
                    <option value="Team Lead">Team Lead</option>
                    <option value="Senior Developer">Senior Developer</option>
                    <option value="Developer">Developer</option>
                    <option value="Junior Developer">Junior Developer</option>
                    <option value="Designer">Designer</option>
                    <option value="Product Manager">Product Manager</option>
                    <option value="Business Analyst">Business Analyst</option>
                    <option value="QA Engineer">QA Engineer</option>
                    <option value="DevOps Engineer">DevOps Engineer</option>
                    <option value="Data Analyst">Data Analyst</option>
                    <option value="Marketing Specialist">Marketing Specialist</option>
                    <option value="Sales Representative">Sales Representative</option>
                    <option value="Customer Support">Customer Support</option>
                    <option value="HR Specialist">HR Specialist</option>
                    <option value="Finance Manager">Finance Manager</option>
                    <option value="Operations Manager">Operations Manager</option>
                    <option value="Consultant">Consultant</option>
                    <option value="Intern">Intern</option>
                    <option value="Contractor">Contractor</option>
                    <option value="Other">Other</option>
                  </select>
                  {formData.role === "Other" && (
                    <input
                      type="text"
                      placeholder="Enter custom role"
                      className="input-field w-full mt-2"
                      onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                    />
                  )}
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

              {/* Send Invite Toggle */}
              {!teamMember && (
                <div className="flex items-center space-x-2 p-3 bg-blue-50 rounded-lg">
                  <input
                    type="checkbox"
                    id="sendInvite"
                    checked={sendInvite}
                    onChange={(e) => setSendInvite(e.target.checked)}
                    className="rounded border-[#E5E7EB] text-[#006BFF] focus:ring-[#006BFF]"
                  />
                  <label htmlFor="sendInvite" className="text-sm font-medium text-[#0B3558]">
                    Send email invitation
                  </label>
                  <span className="text-xs text-[#476788]">
                    (Recommended - sends an email invitation they can accept)
                  </span>
                </div>
              )}

              {/* Permissions */}
              {(!teamMember && sendInvite) && (
                <div>
                  <label className="block text-sm font-medium text-[#0B3558] mb-3">
                    Permissions
                  </label>
                  <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto border border-[#E5E7EB] rounded-lg p-3">
                    {[
                      { value: 'view_expenses', label: 'View Expenses' },
                      { value: 'create_expenses', label: 'Create Expenses' },
                      { value: 'edit_expenses', label: 'Edit Expenses' },
                      { value: 'delete_expenses', label: 'Delete Expenses' },
                      { value: 'view_budgets', label: 'View Budgets' },
                      { value: 'create_budgets', label: 'Create Budgets' },
                      { value: 'edit_budgets', label: 'Edit Budgets' },
                      { value: 'delete_budgets', label: 'Delete Budgets' },
                      { value: 'view_analytics', label: 'View Analytics' },
                      { value: 'manage_team', label: 'Manage Team' },
                      { value: 'manage_companies', label: 'Manage Companies' },
                      { value: 'admin_access', label: 'Admin Access' },
                    ].map((permission) => (
                      <label
                        key={permission.value}
                        className="flex items-center text-xs hover:bg-gray-50 cursor-pointer p-1 rounded"
                      >
                        <input
                          type="checkbox"
                          checked={permissions.includes(permission.value)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setPermissions(prev => [...prev, permission.value]);
                            } else {
                              setPermissions(prev => prev.filter(p => p !== permission.value));
                            }
                          }}
                          className="mr-2 text-blue-600"
                        />
                        {permission.label}
                      </label>
                    ))}
                  </div>
                </div>
              )}

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
                ? (sendInvite && !isEditing ? "Sending Invite..." : "Saving...") 
                : isEditing 
                ? "Update Team Member" 
                : sendInvite 
                ? "Send Invitation" 
                : "Add Team Member"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}