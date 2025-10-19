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
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

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
      {
        name: "Integrations",
        href: "/integrations",
        icon: Zap,
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
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-background border-r border-border transform ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } transition-transform duration-300 ease-in-out lg:translate-x-0 lg:sticky lg:top-0 lg:h-screen`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center space-x-3 p-6 flex-shrink-0">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-semibold text-foreground">
              ExpenseTracker
            </h1>
          </div>

          <Separator />

          {/* Navigation - Scrollable */}
          <nav className="flex-1 overflow-y-auto px-4 py-6 min-h-0">
            {navigationGroups.map((group) => (
              <div key={group.title} className="mb-6">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-4 mb-3">
                  {group.title}
                </h3>
                <div className="space-y-1">
                  {group.items.map((item) => {
                    const isActive =
                      pathname === item.href ||
                      (item.href === "/expenses" &&
                        pathname.startsWith("/expenses")) ||
                      (item.href === "/companies" &&
                        pathname.startsWith("/companies")) ||
                      (item.href === "/budget" &&
                        pathname.startsWith("/budget"));
                    return (
                      <Button
                        key={item.name}
                        asChild
                        variant={isActive ? "default" : "ghost"}
                        className={cn(
                          "w-full justify-start",
                          isActive && "bg-primary text-primary-foreground"
                        )}
                      >
                        <Link
                          href={item.href}
                          className="flex items-center space-x-3"
                          onClick={() => {
                            // Only close sidebar on mobile
                            if (window.innerWidth < 1024) {
                              onClose();
                            }
                          }}
                        >
                          <item.icon className="w-5 h-5" />
                          <span className="font-medium">{item.name}</span>
                        </Link>
                      </Button>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          {/* User section and Sign out */}
          <div className="flex-shrink-0 sticky bottom-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
            <Separator />
            {session && (
              <div className="p-4 space-y-3">
                <div className="flex items-center space-x-3 px-2">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {session.user?.name || "User"}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {session.user?.email}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => {
                    signOut({ callbackUrl: "/auth/signin" });
                    onClose();
                  }}
                >
                  <LogOut className="w-5 h-5 mr-3" />
                  <span className="font-medium">Sign out</span>
                </Button>
              </div>
            )}

            {/* Footer */}
            <div className="px-4 pb-4">
              <div className="text-xs text-muted-foreground text-center">
                ExpenseTracker v1.0
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
