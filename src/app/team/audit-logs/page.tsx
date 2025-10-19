"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { format } from "date-fns";
import {
  Activity,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Filter,
  Search,
  User,
  X,
} from "lucide-react";
import AppLayout from "@/components/AppLayout";

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

interface TeamMemberOption {
  id: string;
  displayName: string;
  email: string;
  companyName?: string;
}

type TeamMemberApiResponse = {
  _id?: unknown;
  name?: unknown;
  email?: unknown;
  company?: unknown;
  isPending?: unknown;
};

interface CompanyOption {
  id: string;
  name: string;
}

type FilterType = "search" | "teamMember" | "company";

export default function AuditLogsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status } = useSession();

  const initialTeamMemberId = searchParams.get("teamMemberId") || "";
  const initialCompanyId = searchParams.get("companyId") || "";
  const initialSearch = searchParams.get("search") || "";

  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [activeSearch, setActiveSearch] = useState(initialSearch);
  const [selectedTeamMemberId, setSelectedTeamMemberId] = useState(initialTeamMemberId);
  const [selectedCompanyId, setSelectedCompanyId] = useState(initialCompanyId);
  const [selectedTeamMember, setSelectedTeamMember] = useState<TeamMemberOption | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [teamMemberSearchValue, setTeamMemberSearchValue] = useState("");
  const [teamMemberDropdownOpen, setTeamMemberDropdownOpen] = useState(false);
  const [teamMembers, setTeamMembers] = useState<TeamMemberOption[]>([]);
  const [teamMembersLoading, setTeamMembersLoading] = useState(false);
  const [teamMembersError, setTeamMembersError] = useState("");
  const [companies, setCompanies] = useState<CompanyOption[]>([]);
  const [companiesLoading, setCompaniesLoading] = useState(false);
  const [companiesError, setCompaniesError] = useState("");
  const [selectedCompanyName, setSelectedCompanyName] = useState("");

  const teamMembersRequested = useRef(false);
  const companiesRequested = useRef(false);

  const fetchLogs = async ({
    reset = false,
    searchValue,
    teamMemberValue,
    companyValue,
  }: {
    reset?: boolean;
    searchValue?: string;
    teamMemberValue?: string;
    companyValue?: string;
  } = {}) => {
    const search = searchValue !== undefined ? searchValue : activeSearch;
    const nextTeamMemberId =
      teamMemberValue !== undefined ? teamMemberValue : selectedTeamMemberId;
    const nextCompanyId =
      companyValue !== undefined ? companyValue : selectedCompanyId;
    const requestedPage = reset ? 1 : page + 1;

    if (reset) {
      setPermissionDenied(false);
      setError("");
      setPage(0);
    }

    setLoading(true);

    try {
      const params = new URLSearchParams({
        limit: "30",
        page: String(requestedPage),
      });

      if (nextTeamMemberId) {
        params.set("teamMemberId", nextTeamMemberId);
      }

      if (nextCompanyId) {
        params.set("companyId", nextCompanyId);
      }

      if (search) {
        params.set("search", search);
      }

      const response = await fetch(`/api/audit-logs?${params.toString()}`);

      if (response.status === 403) {
        setPermissionDenied(true);
        setLogs([]);
        setHasMore(false);
        setPage(0);
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to fetch audit logs");
      }

      const data = await response.json();
      const entries: AuditLog[] = data.data || [];

      if (reset) {
        setLogs(entries);
      } else {
        setLogs((previous) => [...previous, ...entries]);
      }

      const totalPages = data.pagination?.totalPages ?? requestedPage;
      setHasMore(requestedPage < totalPages);
      setPage(requestedPage);
      setActiveSearch(search);
      setSelectedTeamMemberId(nextTeamMemberId);
      setSelectedCompanyId(nextCompanyId);
      setError("");
    } catch (fetchError) {
      console.error(fetchError);
      setError("Unable to load audit logs. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const loadTeamMembers = useCallback(async () => {
    if (teamMembersRequested.current) {
      return;
    }

    teamMembersRequested.current = true;
    setTeamMembersLoading(true);
    setTeamMembersError("");

    try {
      const response = await fetch("/api/team-members");
      if (!response.ok) {
        throw new Error("Failed to load team members");
      }

      const data: unknown = await response.json();
      const entries = Array.isArray(data) ? data : [];

      const options: TeamMemberOption[] = entries
        .filter((item): item is TeamMemberApiResponse =>
          item !== null && typeof item === "object"
        )
        .filter((item) => item.isPending !== true)
        .map((item) => {
          const rawId = (item as { _id?: unknown })._id;
          let id = "";

          if (typeof rawId === "string") {
            id = rawId;
          } else if (
            rawId &&
            typeof (rawId as { toString?: unknown }).toString === "function"
          ) {
            id = (rawId as { toString: () => string }).toString();
          }

          if (!id) {
            return null;
          }

          const rawName =
            typeof item.name === "string" ? item.name.trim() : "";
          const email = typeof item.email === "string" ? item.email : "";
          const companyData =
            item.company && typeof item.company === "object"
              ? item.company
              : undefined;
          const companyName =
            companyData &&
            typeof (companyData as { name?: unknown }).name === "string"
              ? ((companyData as { name?: unknown }).name as string)
              : undefined;

          return {
            id,
            displayName: rawName || email || "Unknown member",
            email,
            companyName,
          };
        })
        .filter((entry): entry is TeamMemberOption => entry !== null)
        .sort((a, b) => a.displayName.localeCompare(b.displayName));

      setTeamMembers(options);
    } catch (teamMemberError) {
      console.error(teamMemberError);
      setTeamMembersError("Unable to load team members right now.");
      teamMembersRequested.current = false;
    } finally {
      setTeamMembersLoading(false);
    }
  }, []);

  const loadCompanies = useCallback(async () => {
    if (companiesRequested.current) {
      return;
    }

    companiesRequested.current = true;
    setCompaniesLoading(true);
    setCompaniesError("");

    try {
      const response = await fetch("/api/companies");
      if (!response.ok) {
        throw new Error("Failed to load companies");
      }

      const data: unknown = await response.json();
      const entries = Array.isArray(data) ? data : [];

      const options: CompanyOption[] = entries
        .filter((item) => item && typeof item === "object")
        .map((item) => {
          const objectItem = item as { _id?: unknown; name?: unknown };
          const rawId = objectItem._id;
          const id =
            typeof rawId === "string"
              ? rawId
              : rawId !== undefined
                ? String(rawId)
                : "";

          if (!id) {
            return null;
          }

          return {
            id,
            name:
              typeof objectItem.name === "string"
                ? objectItem.name
                : "Unnamed company",
          };
        })
        .filter((entry): entry is CompanyOption => entry !== null)
        .sort((a, b) => a.name.localeCompare(b.name));

      setCompanies(options);
    } catch (companyError) {
      console.error(companyError);
      setCompaniesError("Unable to load companies right now.");
      companiesRequested.current = false;
    } finally {
      setCompaniesLoading(false);
    }
  }, []);

  const ensureSelectedTeamMember = useCallback(
    async (teamMemberId: string) => {
      if (!teamMemberId) {
        setSelectedTeamMember(null);
        return;
      }

      const existing = teamMembers.find((member) => member.id === teamMemberId);
      if (existing) {
        setSelectedTeamMember(existing);
        setTeamMemberSearchValue(existing.displayName);
        return;
      }

      try {
        const response = await fetch(`/api/team-members/${teamMemberId}`);
        if (!response.ok) {
          throw new Error("Failed to load team member");
        }

        const member: unknown = await response.json();
        if (!member || typeof member !== "object") {
          throw new Error("Invalid team member response");
        }

        const mapped: TeamMemberOption = {
          id:
            typeof (member as { _id?: unknown })._id === "string"
              ? ((member as { _id?: unknown })._id as string)
              : teamMemberId,
          displayName:
            typeof (member as { name?: unknown }).name === "string" &&
            ((member as { name?: unknown }).name as string).trim().length
              ? ((member as { name?: unknown }).name as string)
              : typeof (member as { email?: unknown }).email === "string"
                ? ((member as { email?: unknown }).email as string)
                : teamMemberId,
          email:
            typeof (member as { email?: unknown }).email === "string"
              ? ((member as { email?: unknown }).email as string)
              : "",
          companyName:
            (member as { company?: unknown }).company &&
            typeof (member as { company?: unknown }).company === "object" &&
            (member as { company?: { name?: unknown } }).company !== null &&
            typeof (
              (member as { company?: { name?: unknown } }).company as {
                name?: unknown;
              }
            ).name === "string"
              ? (((member as { company?: { name?: unknown } }).company as {
                  name?: unknown;
                }).name as string)
              : undefined,
        };

        setSelectedTeamMember(mapped);
        setTeamMemberSearchValue(mapped.displayName);
        setTeamMembers((prev) => {
          if (prev.some((entry) => entry.id === mapped.id)) {
            return prev;
          }
          return [...prev, mapped].sort((a, b) =>
            a.displayName.localeCompare(b.displayName)
          );
        });
      } catch (teamMemberError) {
        console.error(teamMemberError);
      }
    },
    [teamMembers]
  );

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated") {
      router.push("/auth/signin");
      return;
    }

    setPage(0);
    setLogs([]);
    setActiveSearch(initialSearch);
    setSearchTerm(initialSearch);
    setSelectedTeamMemberId(initialTeamMemberId);
    setSelectedCompanyId(initialCompanyId);
    fetchLogs({
      reset: true,
      searchValue: initialSearch,
      teamMemberValue: initialTeamMemberId,
      companyValue: initialCompanyId,
    });
    // We intentionally exclude fetchLogs from dependencies to avoid
    // refetch loops since it captures state internally.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, initialTeamMemberId, initialCompanyId, initialSearch, router]);

  useEffect(() => {
    if (filtersOpen) {
      void loadTeamMembers();
      void loadCompanies();
    }
  }, [filtersOpen, loadTeamMembers, loadCompanies]);

  useEffect(() => {
    if (!filtersOpen) {
      setTeamMemberDropdownOpen(false);
    }
  }, [filtersOpen]);

  useEffect(() => {
    void ensureSelectedTeamMember(selectedTeamMemberId);
  }, [selectedTeamMemberId, ensureSelectedTeamMember]);

  useEffect(() => {
    if (initialCompanyId) {
      void loadCompanies();
    }
  }, [initialCompanyId, loadCompanies]);

  useEffect(() => {
    if (!selectedCompanyId) {
      setSelectedCompanyName("");
      return;
    }

    const match = companies.find((company) => company.id === selectedCompanyId);
    if (match) {
      setSelectedCompanyName(match.name);
    }
  }, [selectedCompanyId, companies]);

  const handleLoadMore = async () => {
    if (!loading && hasMore) {
      await fetchLogs();
    }
  };

  const formatDate = (value?: string) => {
    if (!value) return "-";
    try {
      return format(new Date(value), "PPpp");
    } catch (formatError) {
      console.error("Failed to format date", formatError);
      return value;
    }
  };

  const filterChips = useMemo(() => {
    const filters: { label: string; type: FilterType }[] = [];

    if (selectedTeamMemberId) {
      const label =
        selectedTeamMember?.displayName || selectedTeamMember?.email;
      filters.push({
        label: `Team member: ${label || selectedTeamMemberId}`,
        type: "teamMember",
      });
    }

    if (selectedCompanyId) {
      const companyLabel = selectedCompanyName || selectedCompanyId;
      filters.push({
        label: `Company: ${companyLabel}`,
        type: "company",
      });
    }

    if (activeSearch) {
      filters.push({
        label: `Search: "${activeSearch}"`,
        type: "search",
      });
    }

    return filters;
  }, [selectedTeamMemberId, selectedTeamMember, selectedCompanyId, selectedCompanyName, activeSearch]);

  const filteredTeamMembers = useMemo(() => {
    if (!teamMemberSearchValue.trim()) {
      return teamMembers.slice(0, 10);
    }

    const query = teamMemberSearchValue.trim().toLowerCase();
    return teamMembers
      .filter((member) => {
        const name = member.displayName.toLowerCase();
        const email = member.email.toLowerCase();
        const company = (member.companyName || "").toLowerCase();
        return (
          name.includes(query) ||
          (!!email && email.includes(query)) ||
          (!!company && company.includes(query))
        );
      })
      .slice(0, 10);
  }, [teamMembers, teamMemberSearchValue]);

  const updateQueryParams = useCallback(
    ({
      search,
      teamMemberId,
      companyId,
    }: {
      search?: string;
      teamMemberId?: string;
      companyId?: string;
    }) => {
      const params = new URLSearchParams();

      if (search) {
        params.set("search", search);
      }

      if (teamMemberId) {
        params.set("teamMemberId", teamMemberId);
      }

      if (companyId) {
        params.set("companyId", companyId);
      }

      const queryString = params.toString();
      router.replace(
        queryString ? `/team/audit-logs?${queryString}` : "/team/audit-logs",
        { scroll: false }
      );
    },
    [router]
  );

  const handleSelectTeamMember = (member: TeamMemberOption) => {
    setSelectedTeamMember(member);
    setSelectedTeamMemberId(member.id);
    setTeamMemberSearchValue(member.displayName);
    setTeamMemberDropdownOpen(false);
  };

  const handleTeamMemberInputChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = event.target.value;
    setTeamMemberSearchValue(value);
    setTeamMemberDropdownOpen(true);

    if (!value.trim()) {
      setSelectedTeamMemberId("");
      setSelectedTeamMember(null);
    }
  };

  const handleCompanyChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    setSelectedCompanyId(event.target.value);
  };

  const handleTeamMemberInputFocus = async () => {
    setTeamMemberDropdownOpen(true);
    await loadTeamMembers();
  };

  const handleTeamMemberInputBlur = () => {
    setTimeout(() => {
      setTeamMemberDropdownOpen(false);
    }, 150);
  };

  const handleFiltersApply = async () => {
    await applyFilters({
      search: searchTerm,
      teamMember: selectedTeamMemberId,
      company: selectedCompanyId,
    });
    setFiltersOpen(false);
  };

  const applyFilters = async ({
    search = activeSearch,
    teamMember = selectedTeamMemberId,
    company = selectedCompanyId,
  }: {
    search?: string;
    teamMember?: string;
    company?: string;
  } = {}) => {
    await fetchLogs({
      reset: true,
      searchValue: search ?? "",
      teamMemberValue: teamMember ?? "",
      companyValue: company ?? "",
    });

    updateQueryParams({
      search: search?.trim() ? search : undefined,
      teamMemberId: teamMember?.trim() ? teamMember : undefined,
      companyId: company?.trim() ? company : undefined,
    });
  };

  const handleSearch = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await applyFilters({ search: searchTerm });
  };

  const handleRemoveFilter = async (type: FilterType) => {
    switch (type) {
      case "search": {
        setSearchTerm("");
        await applyFilters({ search: "" });
        break;
      }
      case "teamMember": {
        setSelectedTeamMemberId("");
        setSelectedTeamMember(null);
        setTeamMemberSearchValue("");
        await applyFilters({ teamMember: "" });
        break;
      }
      case "company": {
        setSelectedCompanyId("");
        setSelectedCompanyName("");
        await applyFilters({ company: "" });
        break;
      }
    }
  };

  const handleClearFilters = async () => {
    if (
      !activeSearch &&
      !selectedTeamMemberId &&
      !selectedCompanyId &&
      !searchTerm
    ) {
      return;
    }

    setSearchTerm("");
    setSelectedTeamMemberId("");
    setSelectedTeamMember(null);
    setTeamMemberSearchValue("");
    setSelectedCompanyId("");
    setSelectedCompanyName("");

    await applyFilters({ search: "", teamMember: "", company: "" });
  };

  if (status === "loading" || (loading && page === 0 && !permissionDenied)) {
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
    <AppLayout title="Audit Logs">
      <div className="max-w-6xl mx-auto w-full">
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => router.push("/team")}
            className="inline-flex items-center text-sm text-[#476788] hover:text-[#0B3558]"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Team
          </button>
        </div>

        <div className="card p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-[#006BFF]" />
              <h1 className="text-xl font-semibold text-[#0B3558]">
                Audit Activity
              </h1>
            </div>
            {!permissionDenied && (
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full lg:w-auto">
                <form
                  onSubmit={handleSearch}
                  className="flex w-full sm:w-auto sm:flex-row items-stretch sm:items-center gap-2"
                >
                  <div className="input-field-with-icon flex-1 sm:w-72">
                    <Search className="icon w-4 h-4" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(event) => setSearchTerm(event.target.value)}
                      placeholder="Search audit logs"
                      className="input-field w-full"
                      autoComplete="off"
                    />
                  </div>
                  <button
                    type="submit"
                    className="btn-secondary whitespace-nowrap"
                  >
                    Search
                  </button>
                </form>
                <button
                  type="button"
                  onClick={() => setFiltersOpen((previous) => !previous)}
                  className={`btn-secondary inline-flex items-center justify-center gap-2 whitespace-nowrap ${
                    filtersOpen ? "bg-[#EEF4FF] border-[#BFDBFE] text-[#0B3558]" : ""
                  }`}
                >
                  <Filter className="w-4 h-4" />
                  <span>Filters</span>
                  {filtersOpen ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </button>
              </div>
            )}
          </div>

          {filterChips.length > 0 && (
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 text-xs text-[#476788] bg-[#F3F5F9] rounded-lg px-3 py-3 mt-4">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-[#A6BBD1]" />
                <div className="flex flex-wrap gap-2">
                  {filterChips.map((chip) => (
                    <button
                      key={`${chip.type}-${chip.label}`}
                      type="button"
                      onClick={() => void handleRemoveFilter(chip.type)}
                      className="inline-flex items-center gap-1 bg-white border border-[#E5E7EB] text-[#476788] rounded-full px-3 py-1 hover:bg-[#EEF2FF]"
                    >
                      <span>{chip.label}</span>
                      <X className="w-3 h-3" />
                    </button>
                  ))}
                </div>
              </div>
              <button
                type="button"
                onClick={() => void handleClearFilters()}
                className="text-xs text-[#006BFF] hover:underline sm:ml-auto"
              >
                Clear all
              </button>
            </div>
          )}

          {filtersOpen && !permissionDenied && (
            <div className="mt-4 border border-[#E5E7EB] rounded-lg p-4 bg-[#F9FAFB]">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-[#476788] uppercase tracking-wide">
                    Team member
                  </label>
                  <div className="mt-1 relative">
                    <div className="input-field-with-icon">
                      <User className="icon w-4 h-4" />
                      <input
                        type="text"
                        value={teamMemberSearchValue}
                        onChange={handleTeamMemberInputChange}
                        onFocus={() => void handleTeamMemberInputFocus()}
                        onBlur={handleTeamMemberInputBlur}
                        placeholder="Search by name or email"
                        className="input-field pr-10"
                        autoComplete="off"
                      />
                    </div>
                    {teamMembersLoading && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#006BFF]"></div>
                      </div>
                    )}
                    {selectedTeamMemberId && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedTeamMemberId("");
                          setSelectedTeamMember(null);
                          setTeamMemberSearchValue("");
                        }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A6BBD1] hover:text-[#0B3558]"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                    {teamMemberDropdownOpen && (
                      <div className="absolute z-30 w-full mt-1 bg-white border border-[#E5E7EB] rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {filteredTeamMembers.length > 0 ? (
                          filteredTeamMembers.map((member) => (
                            <button
                              type="button"
                              key={member.id}
                              onClick={() => handleSelectTeamMember(member)}
                              className="w-full text-left px-4 py-2 hover:bg-[#EEF2FF] text-sm text-[#0B3558]"
                            >
                              <div className="font-medium">{member.displayName}</div>
                              {member.email && (
                                <div className="text-xs text-[#476788]">
                                  {member.email}
                                  {member.companyName ? ` • ${member.companyName}` : ""}
                                </div>
                              )}
                            </button>
                          ))
                        ) : teamMembersError ? (
                          <div className="px-4 py-3 text-xs text-red-600">
                            {teamMembersError}
                          </div>
                        ) : (
                          <div className="px-4 py-3 text-xs text-[#476788]">
                            No matching team members
                          </div>
                        )}
                      </div>
                    )}
                    {teamMembersError && !teamMemberDropdownOpen && (
                      <p className="mt-2 text-xs text-red-600">
                        {teamMembersError}
                      </p>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#476788] uppercase tracking-wide">
                    Company
                  </label>
                  <div className="mt-1 relative">
                    <select
                      value={selectedCompanyId}
                      onChange={handleCompanyChange}
                      className="input-field w-full appearance-none pr-10"
                    >
                      <option value="">All companies</option>
                      {companies.map((company) => (
                        <option key={company.id} value={company.id}>
                          {company.name}
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-[#A6BBD1]">
                      <ChevronDown className="w-4 h-4" />
                    </div>
                    {companiesLoading && (
                      <div className="absolute right-9 top-1/2 -translate-y-1/2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#006BFF]"></div>
                      </div>
                    )}
                    {companiesError && (
                      <p className="mt-2 text-xs text-red-600">{companiesError}</p>
                    )}
                  </div>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap justify-end gap-2">
                <button
                  type="button"
                  onClick={() => void handleClearFilters()}
                  className="btn-secondary px-4"
                >
                  Clear
                </button>
                <button
                  type="button"
                  onClick={() => void handleFiltersApply()}
                  className="btn-primary px-4"
                >
                  Apply filters
                </button>
              </div>
            </div>
          )}

          <div className="mt-6">
            {permissionDenied ? (
              <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg text-sm">
                You do not have permission to view audit logs. Request the
                "View Audit Logs" permission from your administrator.
              </div>
            ) : error ? (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            ) : logs.length === 0 ? (
              <p className="text-sm text-[#476788]">No audit activity found.</p>
            ) : (
              <div className="space-y-4">
                {logs.map((log) => {
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
                      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-[#0B3558]">
                            {log.description || log.action.replace(/_/g, " ")}
                          </p>
                          <p className="text-xs text-[#476788] mt-1">
                            {log.actorName || log.actorEmail || "System"}
                            {log.targetName ? ` • ${log.targetType}: ${log.targetName}` : ""}
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

                      <div className="mt-3 flex flex-wrap gap-3 text-[11px] text-[#A6BBD1]">
                        <span>Action: {log.action}</span>
                        <span>Target: {log.targetType}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {!permissionDenied && hasMore && (
            <div className="mt-6 flex justify-center">
              <button
                onClick={handleLoadMore}
                disabled={loading}
                className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Loading..." : "Load More"}
              </button>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
