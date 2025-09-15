"use client";

import { useState, useCallback } from "react";

export interface BrandfetchCompany {
  name: string;
  domain: string;
  description?: string;
  icon?: string;
  logo?: string;
  brandId?: string;
}

export interface BrandfetchSearchResult {
  name: string;
  domain: string;
  icon: string;
  brandId: string;
}

export const useBrandfetch = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Search for companies using Brandfetch API
  const searchCompanies = useCallback(async (query: string): Promise<BrandfetchSearchResult[]> => {
    if (!query.trim()) return [];

    setLoading(true);
    setError(null);

    try {
      // Try different Brandfetch API endpoints for search
      let data = [];
      
      try {
        // First try the official search endpoint
        const response = await fetch(`https://api.brandfetch.io/v2/search/${encodeURIComponent(query)}`);
        if (response.ok) {
          data = await response.json();
        }
      } catch (searchError) {
        console.log("Search API failed, generating results manually");
        // If API fails, create mock results based on common domains
        const mockDomains = [
          `${query.toLowerCase().replace(/\s+/g, '')}.com`,
          `${query.toLowerCase().replace(/\s+/g, '')}.org`,
          `${query.toLowerCase().replace(/\s+/g, '')}.net`
        ];
        
        data = mockDomains.map(domain => ({
          name: query,
          domain: domain,
          icon: `https://cdn.brandfetch.io/${domain}/w/128/h/128/fallback/lettermark/icon.webp`,
          brandId: domain
        }));
      }
      
      // Transform the response to our interface
      const results: BrandfetchSearchResult[] = (data || []).slice(0, 10).map((item: any) => ({
        name: item.name || query,
        domain: item.domain || `${query.toLowerCase().replace(/\s+/g, '')}.com`,
        icon: item.icon || `https://cdn.brandfetch.io/${item.domain || query.toLowerCase().replace(/\s+/g, '') + '.com'}/w/128/h/128/fallback/lettermark/icon.webp`,
        brandId: item.brandId || item.domain || `${query.toLowerCase().replace(/\s+/g, '')}.com`,
      }));

      return results;
    } catch (err) {
      console.error("Error searching companies:", err);
      setError(err instanceof Error ? err.message : "Failed to search companies");
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Get company details by domain
  const getCompanyDetails = useCallback(async (domain: string): Promise<BrandfetchCompany | null> => {
    if (!domain.trim()) return null;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`https://api.brandfetch.io/v2/brands/${encodeURIComponent(domain)}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          // Company not found, return basic info
          return {
            name: domain,
            domain: domain,
            icon: `https://cdn.brandfetch.io/${domain}/w/128/h/128/fallback/lettermark/icon.webp`,
          };
        }
        throw new Error(`Brandfetch API error: ${response.status}`);
      }

      const data = await response.json();
      
      return {
        name: data.name || domain,
        domain: data.domain || domain,
        description: data.description,
        icon: data.logos?.[0]?.formats?.[0]?.src || data.icon || `https://cdn.brandfetch.io/${domain}/w/128/h/128/fallback/lettermark/icon.webp`,
        logo: data.logos?.[0]?.formats?.[0]?.src,
        brandId: data.brandId || domain,
      };
    } catch (err) {
      console.error("Error fetching company details:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch company details");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Get company icon URL by domain
  const getCompanyIcon = useCallback((domain: string): string => {
    if (!domain) return "";
    return `https://cdn.brandfetch.io/${domain}/w/128/h/128/fallback/lettermark/icon.webp`;
  }, []);

  return {
    searchCompanies,
    getCompanyDetails,
    getCompanyIcon,
    loading,
    error,
  };
};