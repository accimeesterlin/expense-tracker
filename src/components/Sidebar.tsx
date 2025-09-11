"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import {
  Building2,
  CreditCard,
  TrendingUp,
  AlertTriangle,
  Tag,
  Hash,
  User,
  BarChart3,
  Home,
  DollarSign,
  Target,
  LogOut,
} from "lucide-react";

const navigationGroups = [
  {
    title: "Main",
    items: [
      {
        name: "Dashboard",
        href: "/dashboard",
        icon: Home,
      },
      {
        name: "Companies",
        href: "/companies",
        icon: Building2,
      },
      {
        name: "Expenses",
        href: "/expenses",
        icon: CreditCard,
      },
    ],
  },
  {
    title: "Financial",
    items: [
      {
        name: "Income",
        href: "/income",
        icon: TrendingUp,
      },
      {
        name: "Debts",
        href: "/debts",
        icon: AlertTriangle,
      },
      {
        name: "Budget",
        href: "/budget",
        icon: DollarSign,
      },
      {
        name: "Goals",
        href: "/goals",
        icon: Target,
      },
      {
        name: "Analytics",
        href: "/analytics",
        icon: BarChart3,
      },
    ],
  },
  {
    title: "Organization",
    items: [
      {
        name: "Categories",
        href: "/categories",
        icon: Tag,
      },
      {
        name: "Tags",
        href: "/tags",
        icon: Hash,
      },
      {
        name: "Team",
        href: "/team",
        icon: User,
      },
    ],
  },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-[#E5E7EB] transform ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center space-x-3 p-6 border-b border-[#E5E7EB]">
            <div className="w-10 h-10 bg-[#006BFF] rounded-xl flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-semibold text-[#0B3558]">
              ExpenseTracker
            </h1>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 overflow-y-auto">
            {navigationGroups.map((group) => (
              <div key={group.title} className="mb-6">
                <h3 className="text-xs font-semibold text-[#A6BBD1] uppercase tracking-wide px-4 mb-3">
                  {group.title}
                </h3>
                <div className="space-y-1">
                  {group.items.map((item) => {
                    const isActive = pathname === item.href || 
                      (item.href === "/expenses" && pathname.startsWith("/expenses"));
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        onClick={() => onClose()}
                        className={`flex items-center space-x-3 px-4 py-2.5 rounded-lg transition-colors ${
                          isActive
                            ? "bg-[#006BFF] text-white"
                            : "text-[#476788] hover:text-[#0B3558] hover:bg-[#F8F9FB]"
                        }`}
                      >
                        <item.icon className="w-5 h-5" />
                        <span className="font-medium">{item.name}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          {/* User section and Sign out */}
          {session && (
            <div className="p-4 border-t border-[#E5E7EB] space-y-3">
              <div className="flex items-center space-x-3 px-2">
                <div className="w-8 h-8 bg-[#006BFF]/10 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-[#006BFF]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#0B3558] truncate">
                    {session.user?.name || 'User'}
                  </p>
                  <p className="text-xs text-[#A6BBD1] truncate">
                    {session.user?.email}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  signOut({ callbackUrl: "/auth/signin" });
                  onClose();
                }}
                className="w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg text-[#476788] hover:text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut className="w-5 h-5" />
                <span className="font-medium">Sign out</span>
              </button>
            </div>
          )}

          {/* Footer */}
          <div className="px-4 pb-4">
            <div className="text-xs text-[#A6BBD1] text-center">
              ExpenseTracker v1.0
            </div>
          </div>
        </div>
      </div>
    </>
  );
}