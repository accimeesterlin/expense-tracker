"use client";

import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { Menu, Settings, LogOut, User, DollarSign } from "lucide-react";
import Sidebar from "./Sidebar";
import GlobalSearch from "./GlobalSearch";
import SettingsModal from "./SettingsModal";

interface AppLayoutProps {
  children: React.ReactNode;
  title?: string;
}

export default function AppLayout({
  children,
  title = "Dashboard",
}: AppLayoutProps) {
  const { data: session } = useSession();
  const [showSidebar, setShowSidebar] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  return (
    <div className="min-h-screen bg-[#F8F9FB] flex">
      {/* Sidebar */}
      <Sidebar isOpen={showSidebar} onClose={() => setShowSidebar(false)} />

      {/* Main content area */}
      <div className="flex-1 lg:ml-0">
        {/* Header */}
        <header className="bg-white border-b border-[#E5E7EB]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setShowSidebar(true)}
                  className="p-2 text-[#476788] hover:text-[#0B3558] hover:bg-[#F8F9FB] rounded-lg transition-colors lg:hidden"
                >
                  <Menu className="w-5 h-5" />
                </button>
                <div className="w-10 h-10 bg-[#006BFF] rounded-xl flex items-center justify-center lg:hidden">
                  <DollarSign className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-2xl font-semibold text-[#0B3558] lg:hidden">
                  ExpenseTracker
                </h1>
                <h1 className="text-2xl font-semibold text-[#0B3558] hidden lg:block">
                  {title}
                </h1>
              </div>
              <div className="flex items-center space-x-4">
                {/* Global Search */}
                <GlobalSearch />

                {/* User Menu */}
                <div className="flex items-center space-x-3">
                  <div className="hidden sm:flex items-center space-x-3">
                    <div className="w-8 h-8 bg-[#006BFF]/10 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-[#006BFF]" />
                    </div>
                    <span className="text-sm font-medium text-[#0B3558]">
                      {session?.user?.name}
                    </span>
                  </div>

                  <button
                    onClick={() => setShowSettingsModal(true)}
                    className="p-2 text-[#476788] hover:text-[#0B3558] hover:bg-[#F8F9FB] rounded-lg transition-colors"
                    title="Settings"
                  >
                    <Settings className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => signOut({ callbackUrl: "/auth/signin" })}
                    className="p-2 text-[#476788] hover:text-[#0B3558] hover:bg-[#F8F9FB] rounded-lg transition-colors"
                    title="Sign out"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <div className="p-4 sm:p-6 lg:p-8">{children}</div>

        {/* Settings Modal */}
        {showSettingsModal && (
          <SettingsModal
            isOpen={showSettingsModal}
            onClose={() => setShowSettingsModal(false)}
            userEmail={session?.user?.email || undefined}
            userName={session?.user?.name || undefined}
          />
        )}
      </div>
    </div>
  );
}
