"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { DollarSign } from "lucide-react";

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;
    
    if (session) {
      // If user is authenticated, redirect to dashboard
      router.push("/dashboard");
    } else {
      // If user is not authenticated, redirect to signin
      router.push("/auth/signin");
    }
  }, [session, status, router]);

  // Show loading spinner while redirecting
  return (
    <div className="min-h-screen bg-[#F8F9FB] flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 bg-[#006BFF] rounded-2xl flex items-center justify-center mx-auto mb-4">
          <DollarSign className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl font-semibold text-[#0B3558] mb-2">
          ExpenseTracker
        </h1>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#006BFF] mx-auto"></div>
      </div>
    </div>
  );
}