"use client";

import { useState } from "react";
import Image from "next/image";
import { Building2 } from "lucide-react";
import { useBrandfetch } from "@/hooks/useBrandfetch";

interface CompanyLogoProps {
  companyName: string;
  domain?: string;
  website?: string;
  size?: "sm" | "md" | "lg" | "xl";
  fallbackToInitials?: boolean;
  className?: string;
  showAttribution?: boolean;
}

const sizeClasses = {
  sm: "w-6 h-6",
  md: "w-8 h-8",
  lg: "w-12 h-12",
  xl: "w-16 h-16",
};

const iconSizeClasses = {
  sm: "w-3 h-3",
  md: "w-4 h-4",
  lg: "w-6 h-6",
  xl: "w-8 h-8",
};

const textSizeClasses = {
  sm: "text-xs",
  md: "text-sm",
  lg: "text-base",
  xl: "text-lg",
};

const sizeMap = {
  sm: 24,
  md: 32,
  lg: 48,
  xl: 64,
};

export default function CompanyLogo({
  companyName,
  domain,
  website,
  size = "md",
  fallbackToInitials = true,
  className = "",
  showAttribution = false,
}: CompanyLogoProps) {
  const [imageError, setImageError] = useState(false);
  const { getCompanyIcon } = useBrandfetch();

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getDomainFromWebsite = (website: string): string => {
    try {
      if (website.includes("://")) {
        return new URL(website).hostname;
      }
      return website;
    } catch {
      return website;
    }
  };

  // Determine the domain to use for Brandfetch
  // If no domain/website provided, try to generate one from company name
  const generatedDomain = companyName ? `${companyName.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '')}.com` : null;
  const effectiveDomain = domain || (website ? getDomainFromWebsite(website) : generatedDomain);

  const baseClasses = `${sizeClasses[size]} rounded-lg flex items-center justify-center ${className}`;

  // Try to get logo from Brandfetch if we have a domain
  const logoUrl = effectiveDomain ? getCompanyIcon(effectiveDomain) : null;
  

  const logoElement = logoUrl && !imageError ? (
    <div className={`${baseClasses} overflow-hidden bg-white border border-gray-200 relative group`}>
      <Image
        src={logoUrl}
        alt={`${companyName} logo`}
        width={sizeMap[size]}
        height={sizeMap[size]}
        className="w-full h-full object-contain"
        onError={() => setImageError(true)}
        unoptimized
      />
      {showAttribution && effectiveDomain && (
        <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <div className="text-white text-xs text-center px-1">
            <div>via Brandfetch</div>
            <a
              href="https://brandfetch.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-300 hover:underline"
            >
              brandfetch.com
            </a>
          </div>
        </div>
      )}
    </div>
  ) : fallbackToInitials ? (
    <div className={`${baseClasses} bg-[#006BFF]/10 text-[#006BFF] font-semibold`}>
      <span className={textSizeClasses[size]}>{getInitials(companyName)}</span>
    </div>
  ) : (
    <div className={`${baseClasses} bg-gray-100 text-gray-500`}>
      <Building2 className={iconSizeClasses[size]} />
    </div>
  );

  // Wrap with attribution if needed and not shown on hover
  if (showAttribution && effectiveDomain && logoUrl && !imageError) {
    return (
      <div className="relative">
        {logoElement}
        <div className="text-xs text-gray-500 mt-1 text-center">
          <a
            href="https://brandfetch.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-blue-600 transition-colors"
            title="Logo provided by Brandfetch"
          >
            via Brandfetch
          </a>
        </div>
      </div>
    );
  }

  return logoElement;
}
