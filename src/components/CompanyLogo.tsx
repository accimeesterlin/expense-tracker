"use client";

import { useState, useEffect } from "react";
import { Building2 } from "lucide-react";

interface CompanyLogoProps {
  companyName: string;
  website?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export default function CompanyLogo({
  companyName,
  website,
  size = "md",
  className = "",
}: CompanyLogoProps) {
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const sizeClasses = {
    sm: "w-6 h-6",
    md: "w-8 h-8",
    lg: "w-12 h-12",
  };

  useEffect(() => {
    if (website) {
      fetchLogo();
    }
  }, [website]);

  const fetchLogo = async () => {
    if (!website) return;

    setLoading(true);
    try {
      // Extract domain from website URL
      let domain = website;
      if (website.includes("://")) {
        domain = new URL(website).hostname;
      }

      const response = await fetch(
        `/api/company-logo?domain=${encodeURIComponent(domain)}`
      );
      if (response.ok) {
        const data = await response.json();
        setLogoUrl(data.logoUrl);
      }
    } catch (error) {
      console.error("Error fetching logo:", error);
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <div
        className={`${sizeClasses[size]} bg-gray-200 rounded-lg flex items-center justify-center animate-pulse ${className}`}
      >
        <div className="w-4 h-4 bg-gray-300 rounded"></div>
      </div>
    );
  }

  if (logoUrl) {
    return (
      <img
        src={logoUrl}
        alt={`${companyName} logo`}
        className={`${sizeClasses[size]} rounded-lg object-cover ${className}`}
        onError={() => setLogoUrl(null)}
      />
    );
  }

  // Fallback to initials
  return (
    <div
      className={`${sizeClasses[size]} bg-[#006BFF] rounded-lg flex items-center justify-center ${className}`}
    >
      <span className="text-white font-semibold text-xs">
        {getInitials(companyName)}
      </span>
    </div>
  );
}
