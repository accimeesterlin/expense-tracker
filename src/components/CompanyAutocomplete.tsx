"use client";

import { useState, useEffect, useRef } from "react";
import { Search, Building2, Check } from "lucide-react";
import { useBrandfetch, BrandfetchSearchResult } from "@/hooks/useBrandfetch";
import { useDebounce } from "@/hooks/useDebounce";

interface CompanyAutocompleteProps {
  value: string;
  onChange: (value: string, company?: BrandfetchSearchResult) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  showLogo?: boolean;
  disableAutoSearch?: boolean;
}

export default function CompanyAutocomplete({
  value,
  onChange,
  placeholder = "Search for a company...",
  className = "",
  disabled = false,
  showLogo = true,
  disableAutoSearch = false,
}: CompanyAutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(value);
  const [results, setResults] = useState<BrandfetchSearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  
  const { searchCompanies, loading, getCompanyIcon } = useBrandfetch();
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Search for companies when the debounced search term changes
  useEffect(() => {
    if (!disableAutoSearch && debouncedSearchTerm && debouncedSearchTerm.length >= 2) {
      searchCompanies(debouncedSearchTerm).then((companies) => {
        setResults(companies);
        setSelectedIndex(-1);
        setIsOpen(companies.length > 0);
      });
    } else {
      setResults([]);
      setIsOpen(false);
    }
  }, [debouncedSearchTerm, searchCompanies, disableAutoSearch]);

  // Update search term when value prop changes
  useEffect(() => {
    setSearchTerm(value);
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchTerm(newValue);
    onChange(newValue);
  };

  const handleSelectCompany = (company: BrandfetchSearchResult) => {
    setSearchTerm(company.name);
    onChange(company.name, company);
    setIsOpen(false);
    setSelectedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1));
        break;
      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0 && results[selectedIndex]) {
          handleSelectCompany(results[selectedIndex]);
        }
        break;
      case "Escape":
        e.preventDefault();
        setIsOpen(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const handleInputFocus = () => {
    if (results.length > 0) {
      setIsOpen(true);
    }
  };

  const handleInputBlur = () => {
    // Delay closing to allow clicking on results
    setTimeout(() => {
      setIsOpen(false);
      setSelectedIndex(-1);
    }, 150);
  };

  return (
    <div className="relative">
      <div className="input-field-with-icon">
        <Search className="icon w-5 h-5" />
        <input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          placeholder={placeholder}
          className={`input-field ${className}`}
          disabled={disabled}
          autoComplete="off"
        />
        {loading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#006BFF]"></div>
          </div>
        )}
      </div>

      {isOpen && results.length > 0 && (
        <ul
          ref={listRef}
          className="absolute z-50 w-full mt-1 bg-white border border-[#E5E7EB] rounded-lg shadow-lg max-h-60 overflow-auto"
        >
          {results.map((company, index) => (
            <li
              key={company.domain}
              className={`flex items-center space-x-3 px-4 py-3 cursor-pointer transition-colors ${
                index === selectedIndex
                  ? "bg-[#006BFF]/10 text-[#006BFF]"
                  : "hover:bg-[#F8F9FB] text-[#0B3558]"
              }`}
              onClick={() => handleSelectCompany(company)}
            >
              {showLogo && (
                <div className="w-8 h-8 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <img
                    src={company.icon}
                    alt={`${company.name} logo`}
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = "none";
                      const fallback = target.nextElementSibling as HTMLElement;
                      if (fallback) {
                        fallback.style.display = "flex";
                      }
                    }}
                  />
                  <Building2 className="w-4 h-4 text-[#476788] hidden" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{company.name}</div>
                <div className="text-sm text-[#476788] truncate">{company.domain}</div>
              </div>
              {index === selectedIndex && (
                <Check className="w-4 h-4 text-[#006BFF] flex-shrink-0" />
              )}
            </li>
          ))}
          <li className="px-4 py-2 text-xs text-[#476788] border-t border-[#E5E7EB] bg-[#F8F9FB]">
            <div className="flex items-center justify-between">
              <span>Powered by Brandfetch</span>
              <a
                href="https://brandfetch.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#006BFF] hover:underline"
              >
                brandfetch.com
              </a>
            </div>
          </li>
        </ul>
      )}
    </div>
  );
}