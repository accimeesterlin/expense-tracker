"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Users, Mail, Building2, Shield, Eye, EyeOff } from "lucide-react";
import Link from "next/link";

interface InviteDetails {
  email: string;
  role: string;
  department?: string;
  companyName: string;
  inviterName: string;
  permissions: string[];
  isValid: boolean;
  userExists?: boolean;
  userName?: string;
}

function TeamInviteContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [inviteDetails, setInviteDetails] = useState<InviteDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState("");
  const [newUserData, setNewUserData] = useState({
    name: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [needsAccount, setNeedsAccount] = useState(false);

  useEffect(() => {
    if (!token) {
      setError("Invalid invitation link");
      setLoading(false);
      return;
    }

    fetchInviteDetails();
  }, [token]);

  const fetchInviteDetails = async () => {
    try {
      const response = await fetch(`/api/team-invites/details?token=${token}`);
      const data = await response.json();

      if (response.ok) {
        setInviteDetails(data);
        // Check if user needs to create an account
        // User needs account if: no current session AND the invited user doesn't exist yet
        if (!session && data.isValid && !data.userExists) {
          setNeedsAccount(true);
        }
      } else {
        setError(data.error || "Invalid invitation");
      }
    } catch (error) {
      setError("Failed to load invitation details");
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptInvite = async () => {
    if (!token) return;

    setAccepting(true);
    setError("");

    try {
      const requestData: any = { token };

      // If user needs to create an account, include user data
      if (needsAccount) {
        if (!newUserData.name.trim()) {
          setError("Name is required");
          setAccepting(false);
          return;
        }
        if (!newUserData.password) {
          setError("Password is required");
          setAccepting(false);
          return;
        }
        if (newUserData.password !== newUserData.confirmPassword) {
          setError("Passwords do not match");
          setAccepting(false);
          return;
        }
        if (newUserData.password.length < 6) {
          setError("Password must be at least 6 characters");
          setAccepting(false);
          return;
        }

        requestData.userData = {
          name: newUserData.name.trim(),
          password: newUserData.password,
        };
      }

      const response = await fetch("/api/team-invites/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestData),
      });

      const data = await response.json();

      if (response.ok) {
        // Redirect to sign-in if new account was created, otherwise to team page
        if (needsAccount) {
          router.push("/auth/signin?message=Account created successfully. Please sign in.");
        } else {
          router.push("/team?message=Successfully joined the team!");
        }
      } else {
        setError(data.error || "Failed to accept invitation");
      }
    } catch (error) {
      setError("Something went wrong. Please try again.");
    } finally {
      setAccepting(false);
    }
  };

  const getPermissionLabel = (permission: string) => {
    const labels: Record<string, string> = {
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
      admin_access: "Admin Access",
    };
    return labels[permission] || permission;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F9FB] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#006BFF]"></div>
      </div>
    );
  }

  if (error && !inviteDetails) {
    return (
      <div className="min-h-screen bg-[#F8F9FB] flex items-center justify-center p-4">
        <div className="card max-w-md w-full p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-xl font-semibold text-[#0B3558] mb-2">Invalid Invitation</h1>
          <p className="text-[#476788] mb-6">{error}</p>
          <Link href="/" className="btn-primary inline-block">
            Go to Homepage
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FB] flex items-center justify-center p-4">
      <div className="card max-w-2xl w-full">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#006BFF] to-[#0056CC] text-white p-8 rounded-t-2xl text-center">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold mb-2">You're Invited!</h1>
          <p className="opacity-90">Join {inviteDetails?.companyName} on ExpenseTracker</p>
        </div>

        <div className="p-8">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6 text-sm">
              {error}
            </div>
          )}

          {/* Existing User Message */}
          {inviteDetails && inviteDetails.userExists && !session && (
            <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg mb-6 text-sm">
              <p className="font-medium">Welcome back, {inviteDetails.userName || inviteDetails.email}!</p>
              <p>You already have an account. Please <Link href="/auth/signin" className="underline font-medium">sign in</Link> to accept this invitation.</p>
            </div>
          )}

          {inviteDetails && (
            <>
              {/* Invitation Details */}
              <div className="space-y-4 mb-8">
                <div className="flex items-center space-x-3">
                  <Mail className="w-5 h-5 text-[#476788]" />
                  <div>
                    <p className="text-sm text-[#476788]">Email</p>
                    <p className="font-medium text-[#0B3558]">{inviteDetails.email}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Building2 className="w-5 h-5 text-[#476788]" />
                  <div>
                    <p className="text-sm text-[#476788]">Company</p>
                    <p className="font-medium text-[#0B3558]">{inviteDetails.companyName}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Users className="w-5 h-5 text-[#476788]" />
                  <div>
                    <p className="text-sm text-[#476788]">Role</p>
                    <p className="font-medium text-[#0B3558]">{inviteDetails.role}</p>
                    {inviteDetails.department && (
                      <p className="text-sm text-[#476788]">{inviteDetails.department}</p>
                    )}
                  </div>
                </div>

                {inviteDetails.permissions.length > 0 && (
                  <div className="flex items-start space-x-3">
                    <Shield className="w-5 h-5 text-[#476788] mt-1" />
                    <div>
                      <p className="text-sm text-[#476788] mb-2">Permissions</p>
                      <div className="flex flex-wrap gap-2">
                        {inviteDetails.permissions.map((permission) => (
                          <span
                            key={permission}
                            className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                          >
                            {getPermissionLabel(permission)}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Account Creation Form (if needed) */}
              {needsAccount && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
                  <h3 className="text-lg font-semibold text-[#0B3558] mb-4">
                    Create Your Account
                  </h3>
                  <p className="text-[#476788] mb-4 text-sm">
                    You need to create an account to accept this invitation.
                  </p>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-[#0B3558] mb-2">
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={newUserData.name}
                        onChange={(e) =>
                          setNewUserData(prev => ({ ...prev, name: e.target.value }))
                        }
                        className="input-field w-full"
                        placeholder="Enter your full name"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[#0B3558] mb-2">
                        Password
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          value={newUserData.password}
                          onChange={(e) =>
                            setNewUserData(prev => ({ ...prev, password: e.target.value }))
                          }
                          className="input-field w-full pr-10"
                          placeholder="Create a password"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#476788] hover:text-[#0B3558]"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[#0B3558] mb-2">
                        Confirm Password
                      </label>
                      <input
                        type={showPassword ? "text" : "password"}
                        value={newUserData.confirmPassword}
                        onChange={(e) =>
                          setNewUserData(prev => ({ ...prev, confirmPassword: e.target.value }))
                        }
                        className="input-field w-full"
                        placeholder="Confirm your password"
                        required
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3">
                {inviteDetails.userExists && !session ? (
                  <Link 
                    href={`/auth/signin?callbackUrl=${encodeURIComponent(window.location.href)}`}
                    className="btn-primary flex-1 text-center"
                  >
                    Sign In to Accept Invitation
                  </Link>
                ) : (
                  <button
                    onClick={handleAcceptInvite}
                    disabled={accepting}
                    className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {accepting ? "Accepting..." : "Accept Invitation"}
                  </button>
                )}
                <Link href="/" className="btn-secondary flex-1 text-center">
                  Cancel
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function TeamInvitePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#F8F9FB] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#006BFF]"></div>
      </div>
    }>
      <TeamInviteContent />
    </Suspense>
  );
}