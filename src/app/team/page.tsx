"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Users,
  Edit,
  Trash2,
  Mail,
  Phone,
  User,
} from "lucide-react";
import Link from "next/link";
import TeamMemberModal from "@/components/TeamMemberModal";
import AppLayout from "@/components/AppLayout";

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

export default function TeamPage() {
  const { status } = useSession();
  const router = useRouter();
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | undefined>(
    undefined
  );

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated") {
      router.push("/auth/signin");
      return;
    }
    fetchData();
  }, [status, router]);

  const fetchData = async () => {
    try {
      const [teamResponse, companiesResponse] = await Promise.all([
        fetch("/api/team-members"),
        fetch("/api/companies"),
      ]);

      if (teamResponse.ok) {
        const teamData = await teamResponse.json();
        setTeamMembers(teamData);
      }

      if (companiesResponse.ok) {
        const companiesData = await companiesResponse.json();
        setCompanies(companiesData);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleTeamMemberSuccess = (teamMember: TeamMember) => {
    if (editingMember) {
      setTeamMembers((prev) =>
        prev.map((member) =>
          member._id === editingMember._id ? teamMember : member
        )
      );
    } else {
      setTeamMembers((prev) => [teamMember, ...prev]);
    }
    setShowModal(false);
    setEditingMember(undefined);
  };

  const handleEdit = (member: TeamMember) => {
    setEditingMember(member);
    setShowModal(true);
  };

  const handleDelete = async (member: TeamMember) => {
    if (!confirm(`Are you sure you want to delete "${member.name}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/team-members/${member._id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setTeamMembers((prev) => prev.filter((m) => m._id !== member._id));
      } else {
        const errorData = await response.json();
        alert(errorData.error || "Failed to delete team member");
      }
    } catch (error) {
      alert("Something went wrong. Please try again.");
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

  const hasCompanies = companies.length > 0;

  return (
    <AppLayout title="Team Members">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0 mb-6 sm:mb-8">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-purple-100 rounded-xl flex items-center justify-center">
              <Users className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-semibold text-[#0B3558]">
                Team Members
              </h1>
              <p className="text-xs sm:text-sm text-[#476788]">
                Manage your team and collaborate
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowModal(true)}
            disabled={!hasCompanies}
            className="btn-primary inline-flex items-center space-x-2 text-sm sm:text-base w-full sm:w-auto justify-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-4 h-4" />
            <span>Add Team Member</span>
          </button>
        </div>
        {!hasCompanies && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg mb-8">
            You need to create a company first before adding team members.{" "}
            <Link href="/" className="underline font-medium">
              Go to dashboard
            </Link>
          </div>
        )}

        {/* Team Members List */}
        <div className="card">
          <div className="p-4 sm:p-6 border-b border-[#E5E7EB]">
            <h3 className="text-lg font-semibold text-[#0B3558]">
              Your Team ({teamMembers.length})
            </h3>
          </div>

          {teamMembers.length === 0 ? (
            <div className="p-8 sm:p-12 text-center">
              <Users className="w-12 h-12 text-[#A6BBD1] mx-auto mb-4" />
              <p className="text-[#476788] mb-4">No team members added yet</p>
              {hasCompanies && (
                <button
                  onClick={() => setShowModal(true)}
                  className="btn-primary inline-flex items-center space-x-2 text-sm sm:text-base"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Your First Team Member</span>
                </button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-[#E5E7EB]">
              {teamMembers.map((member) => (
                <div
                  key={member._id}
                  className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-[#006BFF]/10 rounded-full flex items-center justify-center">
                      <User className="w-6 h-6 text-[#006BFF]" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h4 className="font-medium text-[#0B3558]">
                          {member.name}
                        </h4>
                        {!member.isActive && (
                          <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
                            Inactive
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-[#476788]">{member.role}</p>
                      {member.department && (
                        <p className="text-xs text-[#A6BBD1]">
                          {member.department}
                        </p>
                      )}
                      <p className="text-xs text-[#476788] mt-1">
                        {member.company.name}
                      </p>
                      <div className="flex items-center space-x-4 mt-2">
                        <div className="flex items-center space-x-1">
                          <Mail className="w-3 h-3 text-[#A6BBD1]" />
                          <span className="text-xs text-[#476788]">
                            {member.email}
                          </span>
                        </div>
                        {member.phone && (
                          <div className="flex items-center space-x-1">
                            <Phone className="w-3 h-3 text-[#A6BBD1]" />
                            <span className="text-xs text-[#476788]">
                              {member.phone}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 sm:justify-end">
                    <button
                      onClick={() => handleEdit(member)}
                      className="p-2 text-[#476788] hover:text-[#0B3558] hover:bg-[#F8F9FB] rounded-lg transition-colors"
                      title="Edit member"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(member)}
                      className="p-2 text-[#476788] hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete member"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Team Member Modal */}
      {showModal && (
        <TeamMemberModal
          isOpen={showModal}
          onClose={() => {
            setShowModal(false);
            setEditingMember(undefined);
          }}
          companies={companies}
          teamMember={editingMember}
          onSuccess={handleTeamMemberSuccess}
        />
      )}
    </AppLayout>
  );
}
