"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Zap,
  Plus,
  Settings,
  Check,
  X,
  ExternalLink,
  Mail,
  Send,
  Workflow,
  AlertCircle,
} from "lucide-react";
import AppLayout from "@/components/AppLayout";

interface Integration {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  category: string;
  isConnected: boolean;
  settings?: {
    apiKey?: string;
    webhookUrl?: string;
    enabled?: boolean;
  };
}

const availableIntegrations: Integration[] = [
  {
    id: "zapier",
    name: "Zapier",
    description: "Automate workflows between your expense tracker and 5000+ apps",
    icon: Workflow,
    category: "Automation",
    isConnected: false,
  },
  {
    id: "mailchimp",
    name: "Mailchimp",
    description: "Send expense reports and notifications via email campaigns",
    icon: Mail,
    category: "Email Marketing",
    isConnected: false,
  },
  {
    id: "sendgrid",
    name: "SendGrid",
    description: "Reliable email delivery for expense notifications and reports",
    icon: Send,
    category: "Email Delivery",
    isConnected: false,
  },
  {
    id: "mailgun",
    name: "Mailgun",
    description: "Powerful email API for transactional expense notifications",
    icon: Mail,
    category: "Email Delivery",
    isConnected: false,
  },
  {
    id: "zeptomail",
    name: "ZeptoMail",
    description: "Fast and reliable transactional email service",
    icon: Send,
    category: "Email Delivery",
    isConnected: false,
  },
];

export default function IntegrationsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [integrationsLoaded, setIntegrationsLoaded] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [showConnectionModal, setShowConnectionModal] = useState(false);
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);
  const [connectionForm, setConnectionForm] = useState({
    apiKey: "",
    webhookUrl: "",
    enabled: true,
  });

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/auth/signin");
      return;
    }
    // Load user's integration settings from localStorage
    loadIntegrationsFromStorage();
  }, [session, status, router]);

  const loadIntegrationsFromStorage = () => {
    try {
      const saved = localStorage.getItem('expense-tracker-integrations');
      if (saved) {
        const savedIntegrations = JSON.parse(saved);
        // Merge saved settings with available integrations
        const mergedIntegrations = availableIntegrations.map(integration => {
          const savedIntegration = savedIntegrations.find((s: Integration) => s.id === integration.id);
          if (savedIntegration) {
            // Merge saved data but preserve the icon from the original integration
            return {
              ...integration,
              ...savedIntegration,
              icon: integration.icon, // Always use the original icon
            };
          }
          return integration;
        });
        setIntegrations(mergedIntegrations);
      } else {
        // No saved data, use default available integrations
        setIntegrations(availableIntegrations);
      }
    } catch (error) {
      console.error('Failed to load integrations from storage:', error);
      // Fallback to default integrations
      setIntegrations(availableIntegrations);
    } finally {
      setIntegrationsLoaded(true);
    }
  };

  const saveIntegrationsToStorage = (updatedIntegrations: Integration[]) => {
    try {
      localStorage.setItem('expense-tracker-integrations', JSON.stringify(updatedIntegrations));
    } catch (error) {
      console.error('Failed to save integrations to storage:', error);
    }
  };

  const categories = ["All", ...Array.from(new Set(availableIntegrations.map(i => i.category)))];

  const filteredIntegrations = selectedCategory === "All" 
    ? integrations 
    : integrations.filter(i => i.category === selectedCategory);

  const handleConnect = (integration: Integration) => {
    setSelectedIntegration(integration);
    setConnectionForm({
      apiKey: integration.settings?.apiKey || "",
      webhookUrl: integration.settings?.webhookUrl || "",
      enabled: integration.settings?.enabled ?? true,
    });
    setShowConnectionModal(true);
  };

  const handleSaveConnection = async () => {
    if (!selectedIntegration) return;

    // Save integration settings to localStorage
    const updatedIntegrations = integrations.map(i => 
      i.id === selectedIntegration.id 
        ? {
            ...i,
            isConnected: true,
            settings: connectionForm,
          }
        : i
    );
    
    setIntegrations(updatedIntegrations);
    saveIntegrationsToStorage(updatedIntegrations);
    setShowConnectionModal(false);
    setSelectedIntegration(null);
  };

  const handleDisconnect = async (integrationId: string) => {
    if (!confirm("Are you sure you want to disconnect this integration?")) return;

    // Remove integration settings from localStorage
    const updatedIntegrations = integrations.map(i => 
      i.id === integrationId 
        ? { ...i, isConnected: false, settings: undefined }
        : i
    );
    
    setIntegrations(updatedIntegrations);
    saveIntegrationsToStorage(updatedIntegrations);
  };

  if (status === "loading" || !integrationsLoaded) {
    return (
      <div className="min-h-screen bg-[#F8F9FB] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#006BFF]"></div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <AppLayout title="Integrations">
      {/* Page Header */}
      <div className="bg-white border-b border-[#E5E7EB] -m-3 sm:-m-4 lg:-m-6 mb-3 sm:mb-4 lg:mb-6 w-full overflow-x-hidden">
        <div className="w-full px-3 sm:px-4 lg:px-6 py-3 sm:py-4 lg:py-6 overflow-x-hidden">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-3 w-full">
            <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
              <div className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Zap className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 text-purple-600" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-base sm:text-lg lg:text-xl font-semibold text-[#0B3558] truncate">
                  Integrations
                </h1>
                <p className="text-xs sm:text-sm text-[#476788] truncate">
                  Connect with external services to automate your workflow
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4 sm:space-y-6 lg:space-y-8 w-full overflow-x-hidden">
        {/* Category Filter */}
        <div className="card p-3 sm:p-4 lg:p-6">
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  selectedCategory === category
                    ? "bg-[#006BFF] text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Integrations Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6 w-full">
          {filteredIntegrations.map((integration) => {
            const IconComponent = integration.icon;
            return (
              <div
                key={integration.id}
                className="card p-4 sm:p-6 hover:shadow-lg transition-shadow w-full overflow-hidden"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                      <IconComponent className="w-5 h-5 text-gray-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-[#0B3558] text-sm sm:text-base">
                        {integration.name}
                      </h3>
                      <span className="text-xs text-[#476788]">
                        {integration.category}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1">
                    {integration.isConnected ? (
                      <span className="flex items-center space-x-1 text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">
                        <Check className="w-3 h-3" />
                        <span>Connected</span>
                      </span>
                    ) : (
                      <span className="flex items-center space-x-1 text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                        <X className="w-3 h-3" />
                        <span>Not Connected</span>
                      </span>
                    )}
                  </div>
                </div>

                <p className="text-sm text-[#476788] mb-4 line-clamp-2">
                  {integration.description}
                </p>

                <div className="flex items-center space-x-2">
                  {integration.isConnected ? (
                    <>
                      <button
                        onClick={() => handleConnect(integration)}
                        className="btn-secondary text-xs sm:text-sm flex-1 inline-flex items-center justify-center space-x-1"
                      >
                        <Settings className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span>Settings</span>
                      </button>
                      <button
                        onClick={() => handleDisconnect(integration.id)}
                        className="btn-secondary text-red-600 hover:text-red-700 hover:bg-red-50 text-xs sm:text-sm px-3"
                      >
                        Disconnect
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => handleConnect(integration)}
                      className="btn-primary text-xs sm:text-sm inline-flex items-center justify-center space-x-1 px-4"
                    >
                      <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span>Connect</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Help Section */}
        <div className="card p-4 sm:p-6 bg-blue-50 border-blue-200">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-blue-900 mb-2">Need Help?</h3>
              <p className="text-sm text-blue-800 mb-3">
                Learn how to set up integrations and automate your expense tracking workflow.
              </p>
              <a
                href="#"
                className="inline-flex items-center space-x-1 text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                <span>View Documentation</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Connection Modal */}
      {showConnectionModal && selectedIntegration && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-sm w-full">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-lg font-semibold text-gray-900">
                Configure {selectedIntegration.name}
              </h3>
              <button
                onClick={() => setShowConnectionModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  API Key
                </label>
                <input
                  type="password"
                  value={connectionForm.apiKey}
                  onChange={(e) => setConnectionForm(prev => ({ ...prev, apiKey: e.target.value }))}
                  className="input-field w-full"
                  placeholder="Enter your API key"
                />
              </div>
              
              {selectedIntegration.id === 'zapier' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Webhook URL
                  </label>
                  <input
                    type="url"
                    value={connectionForm.webhookUrl}
                    onChange={(e) => setConnectionForm(prev => ({ ...prev, webhookUrl: e.target.value }))}
                    className="input-field w-full"
                    placeholder="https://hooks.zapier.com/..."
                  />
                </div>
              )}
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="enabled"
                  checked={connectionForm.enabled}
                  onChange={(e) => setConnectionForm(prev => ({ ...prev, enabled: e.target.checked }))}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="enabled" className="text-sm text-gray-700">
                  Enable this integration
                </label>
              </div>
            </div>
            
            <div className="flex items-center justify-end space-x-3 p-6 border-t bg-gray-50">
              <button
                onClick={() => setShowConnectionModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveConnection}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
              >
                {selectedIntegration.isConnected ? 'Update' : 'Connect'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}