"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

interface SidebarContextType {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  toggleSidebar: () => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load sidebar state from localStorage on mount
  useEffect(() => {
    const savedState = localStorage.getItem("sidebar-open");
    if (savedState !== null) {
      setIsOpen(JSON.parse(savedState));
    } else {
      // Default to open on desktop, closed on mobile
      const isDesktop = window.innerWidth >= 1024; // lg breakpoint
      setIsOpen(isDesktop);
    }
    setIsInitialized(true);
  }, []);

  // Save sidebar state to localStorage whenever it changes (only after initialization)
  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem("sidebar-open", JSON.stringify(isOpen));
    }
  }, [isOpen, isInitialized]);

  // Handle window resize to auto-close on mobile (with debouncing)
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        const isDesktop = window.innerWidth >= 1024;
        // Only close on resize if moving from desktop to mobile, not always
        if (!isDesktop && isOpen && window.innerWidth < 768) {
          setIsOpen(false);
        }
      }, 150); // Increased debounce time
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      clearTimeout(timeoutId);
    };
  }, [isOpen]);

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  return (
    <SidebarContext.Provider value={{ isOpen, setIsOpen, toggleSidebar }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (context === undefined) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
}
