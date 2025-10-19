"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { format } from "date-fns";
import {
  Activity,
  ArrowLeft,
  Building2,
  CheckCircle,
  XCircle,
  Mail,
  Phone,
  Search,
  ShieldCheck,
  User,
  Edit,
  Save,
  X,
} from "lucide-react";
import AppLayout from "@/components/AppLayout";

interface Company {
  _id: string;
  name: string;
  industry?: string;
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
  permissions?: string[];
  createdAt: string;
  updatedAt: string;
}

interface AuditLog {
  _id: string;
  action: string;
  description?: string;
  targetType: string;
  targetName?: string;
  actorName?: string;
  actorEmail?: string;
  createdAt: string;
  metadata?: Record<string, unknown> & {
    changedFields?: string[];
    permissions?: string[];
    role?: string;
    email?: string;
    viaInvite?: boolean;
  };
}

const permissionLabels: Record<string, string> = {
  view_expenses: "View Expenses",
  create_expenses: "Create Expenses",
  edit_expenses: "Edit Expenses",
  delete_expenses: "Delete Expenses",
  view_budgets: "View Budgets",
  create_budgets: "Create Budgets",
  edit_budgets: "Edit Budgets",
  delete_budgets: "Delete Budgets",
  view_analytics: "View Analytics",
  manage_team: "Manage Team",
  manage_companies: "Manage Companies",
  view_audit_logs: "View Audit Logs",
  admin_access: "Admin Access",
};

export default function TeamMemberDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;
  const router = useRouter();
  const { status } = useSession();

  const [teamMember, setTeamMember] = useState<TeamMember | null>(null);
  const [memberLoading, setMemberLoading] = useState(true);
  const [memberError, setMemberError] = useState("");

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [auditLoading, setAuditLoading] = useState(true);
  const [auditError, setAuditError] = useState("");
  const [auditPermissionDenied, setAuditPermissionDenied] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  
  const [isEditingPermissions, setIsEditingPermissions] = useState(false);
  const [editedPermissions, setEditedPermissions] = useState<string[]>([]);
  const [userPermissions, setUserPermissions] = useState<string[]>([]);
  const [permissionLoading, setPermissionLoading] = useState(false);
  const [permissionError, setPermissionError] = useState("");

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated") {
      router.push("/auth/signin");
      return;
    }

    const loadMember = async () => {
      setMemberLoading(true);
      setMemberError("");

      try {
        const response = await fetch(`/api/team-members/${id}`);

        if (response.status === 404) {
          setTeamMember(null);
          setMemberError("Team member not found");
          return;
        }

        if (!response.ok) {
          throw new Error("Failed to fetch team member");
        }

        const data = await response.json();
        setTeamMember(data);
        setEditedPermissions(data.permissions || []);
        
        // Fetch user permissions to check if they can edit this team member
        await fetchUserPermissions(data.company._id);
        await fetchAuditLogs("", false);
      } catch (error) {
        console.error(error);
        setMemberError("Failed to load team member details. Please try again.");
      } finally {
        setMemberLoading(false);
      }
    };

    loadMember();
  }, [status, id, router]);

  const fetchUserPermissions = async (companyId: string) => {
    try {
      const response = await fetch(`/api/user-permissions?companyId=${companyId}`);
      if (response.ok) {
        const data = await response.json();
        setUserPermissions(data.permissions || []);
      }
    } catch (error) {
      console.error("Failed to fetch user permissions:", error);
    }
  };

  const fetchAuditLogs = async (term = "", showLoading = true) => {
    if (showLoading) {
      setAuditLoading(true);
    }
    setAuditError("");

    try {
      const params = new URLSearchParams({
        teamMemberId: id,
        limit: "20",
      });

      if (term) {
        params.set("search", term);
      }

      const response = await fetch(`/api/audit-logs?${params.toString()}`);

      if (response.status === 403) {
        setAuditPermissionDenied(true);
        setAuditLogs([]);
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to fetch audit logs");
      }

      const data = await response.json();
      setAuditLogs(data.data || []);
      setAuditPermissionDenied(false);
    } catch (error) {
      console.error(error);
      setAuditError("Unable to load audit logs. Please try again later.");
    } finally {
      setAuditLoading(false);
    }
  };

  const handleSearch = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await fetchAuditLogs(searchTerm);
  };

  const canEditPermissions = useMemo(() => {
    return userPermissions.includes('manage_team') || userPermissions.includes('admin_access') || userPermissions.includes('all');
  }, [userPermissions]);

  const handleEditPermissions = () => {
    setIsEditingPermissions(true);
    setPermissionError("");
  };

  const handleCancelEditPermissions = () => {
    setIsEditingPermissions(false);
    setEditedPermissions(teamMember?.permissions || []);
    setPermissionError("");
  };

  const handlePermissionChange = (permission: string, checked: boolean) => {
    if (checked) {
      setEditedPermissions(prev => 
        prev.includes(permission) ? prev : [...prev, permission]
      );
    } else {
      setEditedPermissions(prev => 
        prev.filter(p => p !== permission)
      );
    }
  };

  const handleSavePermissions = async () => {
    if (!teamMember) return;
    
    setPermissionLoading(true);
    setPermissionError("");
    
    try {
      const response = await fetch(`/api/team-members/${teamMember._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          permissions: editedPermissions
        })
      });
      
      if (response.ok) {
        const updatedMember = await response.json();
        setTeamMember(updatedMember);
        setIsEditingPermissions(false);
      } else {
        const errorData = await response.json();
        setPermissionError(errorData.error || 'Failed to update permissions');
      }
    } catch (error) {
      setPermissionError('Something went wrong. Please try again.');
    } finally {
      setPermissionLoading(false);
    }
  };

  const filteredPermissions = useMemo(() => {
    if (!teamMember?.permissions) return [];
    return teamMember.permissions.map((permission) => ({
      key: permission,
      label: permissionLabels[permission] || permission,
    }));
  }, [teamMember]);

  const formatDate = (value?: string) => {
    if (!value) return "-";
    try {
      return format(new Date(value), "PPpp");
    } catch (error) {
      console.error("Failed to format date", error);
      return value;
    }
  };

  if (status === "loading" || memberLoading) {
    return (
      <div className="min-h-screen bg-[#F8F9FB] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#006BFF]"></div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return null;
  }

  return (
    <AppLayout title="Team Member Details">
      <div className="max-w-5xl mx-auto w-full">
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => router.push("/team")}
            className="inline-flex items-center text-sm text-[#476788] hover:text-[#0B3558]"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Team
          </button>
        </div>

        {memberError && !teamMember ? (
          <div className="card p-6 text-center">
            <p className="text-[#476788]">{memberError}</p>
          </div>
        ) : teamMember ? (
          <div className="space-y-6">
            <div className="card p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-[#006BFF]/10 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-[#006BFF]" />
                  </div>
                  <div>
                    <h1 className="text-xl font-semibold text-[#0B3558]">
                      {teamMember.name}
                    </h1>
                    <p className="text-sm text-[#476788]">{teamMember.role}</p>
                    <p className="text-xs text-[#A6BBD1]">
                      Last updated {formatDate(teamMember.updatedAt)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {teamMember.isActive ? (
                    <span className="inline-flex items-center px-3 py-1 bg-green-50 text-green-700 text-xs font-medium rounded-full">
                      <CheckCircle className="w-3 h-3 mr-1" /> Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-3 py-1 bg-red-50 text-red-600 text-xs font-medium rounded-full">
                      <XCircle className="w-3 h-3 mr-1" /> Inactive
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-[#A6BBD1] uppercase">Email</p>
                    <div className="flex items-center gap-2 text-sm text-[#0B3558] mt-1">
                      <Mail className="w-4 h-4 text-[#A6BBD1]" />
                      <span>{teamMember.email}</span>
                    </div>
                  </div>
                  {teamMember.phone && (
                    <div>
                      <p className="text-xs text-[#A6BBD1] uppercase">Phone</p>
                      <div className="flex items-center gap-2 text-sm text-[#0B3558] mt-1">
                        <Phone className="w-4 h-4 text-[#A6BBD1]" />
                        <span>{teamMember.phone}</span>
                      </div>
                    </div>
                  )}
                  {teamMember.department && (
                    <div>
                      <p className="text-xs text-[#A6BBD1] uppercase">Department</p>
                      <p className="text-sm text-[#0B3558] mt-1">{teamMember.department}</p>
                    </div>
                  )}
                </div>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-[#A6BBD1] uppercase">Company</p>
                    <div className="flex items-center gap-2 text-sm text-[#0B3558] mt-1">
                      <Building2 className="w-4 h-4 text-[#A6BBD1]" />
                      <span>{teamMember.company?.name}</span>
                    </div>
                    {teamMember.company?.industry && (
                      <p className="text-xs text-[#476788] mt-1">
                        {teamMember.company.industry}
                      </p>
                    )}
                  </div>
                  <div>
                    <p className="text-xs text-[#A6BBD1] uppercase">Joined</p>
                    <p className="text-sm text-[#0B3558] mt-1">
                      {formatDate(teamMember.createdAt)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-[#006BFF]" />
                  <h2 className="text-lg font-semibold text-[#0B3558]">
                    Permissions
                  </h2>
                </div>
                <div className="flex items-center gap-2">
                  {canEditPermissions && !isEditingPermissions && (
                    <button
                      onClick={handleEditPermissions}
                      className="inline-flex items-center gap-1 text-sm text-[#006BFF] hover:underline"
                    >
                      <Edit className="w-4 h-4" />
                      Edit
                    </button>
                  )}
                  <Link
                    href={`/team/audit-logs?teamMemberId=${teamMember._id}`}
                    className="text-sm text-[#006BFF] hover:underline"
                  >
                    View audit history
                  </Link>
                </div>
              </div>

              {permissionError && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm mb-4">
                  {permissionError}
                </div>
              )}

              {isEditingPermissions ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto border border-[#E5E7EB] rounded-lg p-3">
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
                      { value: 'view_audit_logs', label: 'View Audit Logs' },
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
                          checked={editedPermissions.includes(permission.value)}
                          onChange={(e) => handlePermissionChange(permission.value, e.target.checked)}
                          className="mr-2 text-blue-600"
                        />
                        {permission.label}
                      </label>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleSavePermissions}
                      disabled={permissionLoading}
                      className="inline-flex items-center gap-1 px-3 py-2 bg-[#006BFF] text-white text-sm rounded-lg hover:bg-[#0056d6] disabled:opacity-50"
                    >
                      <Save className="w-4 h-4" />
                      {permissionLoading ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button
                      onClick={handleCancelEditPermissions}
                      disabled={permissionLoading}
                      className="inline-flex items-center gap-1 px-3 py-2 border border-[#E5E7EB] text-[#476788] text-sm rounded-lg hover:bg-[#F8F9FB] disabled:opacity-50"
                    >
                      <X className="w-4 h-4" />
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                filteredPermissions.length === 0 ? (
                  <p className="text-sm text-[#476788]">
                    No permissions assigned.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {filteredPermissions.map((permission) => (
                      <span
                        key={permission.key}
                        className="px-3 py-1 rounded-full bg-[#F3F5F9] text-xs text-[#0B3558]"
                      >
                        {permission.label}
                      </span>
                    ))}
                  </div>
                )
              )}
            </div>

            <div className="card p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-[#006BFF]" />
                  <h2 className="text-lg font-semibold text-[#0B3558]">
                    Audit Logs
                  </h2>
                </div>
                {!auditPermissionDenied && (
                  <form
                    onSubmit={handleSearch}
                    className="flex items-center gap-2 w-full md:w-auto"
                  >
                    <div className="relative flex-1 md:w-64">
                      <Search className="w-4 h-4 text-[#A6BBD1] absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={(event) => setSearchTerm(event.target.value)}
                        placeholder="Search audit logs"
                        className="input-field pl-9"
                      />
                    </div>
                    <button type="submit" className="btn-secondary whitespace-nowrap">
                      Search
                    </button>
                  </form>
                )}
              </div>

              {auditPermissionDenied ? (
                <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg text-sm">
                  You do not have permission to view audit logs for this team member.
                </div>
              ) : auditLoading ? (
                <div className="flex items-center justify-center py-10">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#006BFF]"></div>
                </div>
              ) : auditError ? (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                  {auditError}
                </div>
              ) : auditLogs.length === 0 ? (
                <p className="text-sm text-[#476788]">No audit activity recorded yet.</p>
              ) : (
                <div className="space-y-4">
                  {auditLogs.map((log) => {
                    const metadataMessages: string[] = [];

                    if (Array.isArray(log.metadata?.changedFields) && log.metadata?.changedFields.length) {
                      metadataMessages.push(
                        `Changed: ${log.metadata.changedFields.join(", ")}`
                      );
                    }

                    if (Array.isArray(log.metadata?.permissions) && log.metadata?.permissions.length) {
                      const labels = log.metadata.permissions
                        .map((permission) => permissionLabels[permission] || permission)
                        .join(", ");
                      metadataMessages.push(`Permissions: ${labels}`);
                    }

                    if (log.metadata?.role) {
                      metadataMessages.push(`Role: ${String(log.metadata.role)}`);
                    }

                    if (log.metadata?.email) {
                      metadataMessages.push(`Email: ${String(log.metadata.email)}`);
                    }

                    if (log.metadata?.viaInvite) {
                      metadataMessages.push("Joined via invitation");
                    }

                    return (
                      <div
                        key={log._id}
                        className="border border-[#E5E7EB] rounded-lg p-4"
                      >
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                          <div>
                            <p className="text-sm font-semibold text-[#0B3558]">
                              {log.description || log.action.replace(/_/g, " ")}
                            </p>
                            <p className="text-xs text-[#476788] mt-1">
                              {log.actorName || log.actorEmail || "System"}
                              {log.targetName ? ` • ${log.targetName}` : ""}
                            </p>
                          </div>
                          <p className="text-xs text-[#A6BBD1]">
                            {formatDate(log.createdAt)}
                          </p>
                        </div>
                        {metadataMessages.length > 0 && (
                          <ul className="mt-3 space-y-1">
                            {metadataMessages.map((message, index) => (
                              <li key={`${log._id}-meta-${index}`} className="text-xs text-[#476788]">
                                {message}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </AppLayout>
  );
}
