"use client";

import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { Menu, Settings, User, DollarSign, LogOut } from "lucide-react";
import Sidebar from "./Sidebar";
import GlobalSearch from "./GlobalSearch";
import SettingsModal from "./SettingsModal";
import { useSidebar } from "@/contexts/SidebarContext";

interface AppLayoutProps {
  children: React.ReactNode;
  title?: string;
}

export default function AppLayout({
  children,
  title = "Dashboard",
}: AppLayoutProps) {
  const { data: session } = useSession();
  const {
    isOpen: showSidebar,
    setIsOpen: setShowSidebar,
    toggleSidebar,
  } = useSidebar();
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  return (
    <div className="min-h-screen bg-[#F8F9FB] flex w-full overflow-x-hidden">
      {/* Sidebar */}
      <Sidebar isOpen={showSidebar} onClose={() => setShowSidebar(false)} />

      {/* Main content area */}
      <div className="flex-1 lg:ml-0 min-w-0 w-full overflow-x-hidden">
        {/* Header */}
        <header className="bg-white border-b border-[#E5E7EB] w-full">
          <div className="w-full px-3 sm:px-4 lg:px-6">
            <div className="flex justify-between items-center h-16 gap-2">
              <div className="flex items-center space-x-1 sm:space-x-2 min-w-0 flex-1">
                <button
                  onClick={toggleSidebar}
                  className="p-1.5 sm:p-2 text-[#476788] hover:text-[#0B3558] hover:bg-[#F8F9FB] rounded-lg transition-colors lg:hidden flex-shrink-0"
                >
                  <Menu className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
                <div className="w-8 h-8 lg:w-10 lg:h-10 bg-[#006BFF] rounded-xl flex items-center justify-center lg:hidden flex-shrink-0 hidden sm:flex">
                  <DollarSign className="w-4 h-4 lg:w-6 lg:h-6 text-white" />
                </div>
                <h1 className="text-sm sm:text-base lg:text-xl font-semibold text-[#0B3558] lg:hidden truncate min-w-0">
                  ExpenseTracker
                </h1>
                <h1 className="text-xl lg:text-2xl font-semibold text-[#0B3558] hidden lg:block truncate min-w-0">
                  {title}
                </h1>
              </div>
              <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                {/* Global Search */}
                <div className="flex-shrink-0">
                  <GlobalSearch />
                </div>

                {/* User Menu */}
                <div className="flex items-center gap-1 sm:gap-2">
                  <div className="hidden sm:flex items-center gap-2">
                    <div className="w-6 h-6 sm:w-8 sm:h-8 bg-[#006BFF]/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <User className="w-3 h-3 sm:w-4 sm:h-4 text-[#006BFF]" />
                    </div>
                    <span className="text-xs sm:text-sm font-medium text-[#0B3558] hidden lg:block truncate max-w-20">
                      {session?.user?.name}
                    </span>
                  </div>

                  <button
                    onClick={() => setShowSettingsModal(true)}
                    className="p-1.5 sm:p-2 text-[#476788] hover:text-[#0B3558] hover:bg-[#F8F9FB] rounded-lg transition-colors flex-shrink-0"
                    title="Settings"
                  >
                    <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>

                  <button
                    onClick={() => signOut({ callbackUrl: "/auth/signin" })}
                    className="p-1.5 sm:p-2 text-[#476788] hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                    title="Sign out"
                  >
                    <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <div className="p-3 sm:p-4 lg:p-6 xl:p-8 w-full overflow-x-hidden">
          <div className="w-full max-w-none overflow-x-hidden">{children}</div>
        </div>

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
