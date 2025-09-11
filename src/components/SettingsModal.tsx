"use client";

import { useState, useEffect } from "react";
import {
  X,
  User,
  Bell,
  Shield,
  Palette,
  Database,
  Download,
} from "lucide-react";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail?: string;
  userName?: string;
}

export default function SettingsModal({
  isOpen,
  onClose,
  userEmail,
  userName,
}: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<
    | "profile"
    | "notifications"
    | "preferences"
    | "security"
    | "privacy"
    | "appearance"
    | "data"
  >("profile");
  const [settings, setSettings] = useState({
    profile: {
      name: "",
      email: "",
      timezone: "America/New_York",
    },
    notifications: {
      emailNotifications: true,
      pushNotifications: true,
      upcomingPayments: true,
      overduePayments: true,
      weeklyReports: false,
    },
    privacy: {
      dataSharing: false,
      analytics: true,
      marketing: false,
    },
    appearance: {
      theme: "light",
      currency: "USD",
      dateFormat: "MM/DD/YYYY",
    },
    data: {
      exportFormat: "csv",
      autoBackup: true,
    },
  });

  useEffect(() => {
    if (isOpen) {
      // Load user settings from localStorage or API
      const savedSettings = localStorage.getItem("expense-tracker-settings");
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings));
      }

      // Set user data from session
      if (userEmail || userName) {
        setSettings((prev) => ({
          ...prev,
          profile: {
            ...prev.profile,
            name: userName || prev.profile.name,
            email: userEmail || prev.profile.email,
          },
        }));
      }
    }
  }, [isOpen, userEmail, userName]);

  const handleSave = () => {
    localStorage.setItem("expense-tracker-settings", JSON.stringify(settings));
    onClose();
  };

  const handleExport = async () => {
    try {
      const response = await fetch("/api/export/data");
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `expense-data-${
          new Date().toISOString().split("T")[0]
        }.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error("Error exporting data:", error);
    }
  };

  if (!isOpen) return null;

  const tabs = [
    { id: "profile", label: "Profile", icon: User },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "privacy", label: "Privacy", icon: Shield },
    { id: "appearance", label: "Appearance", icon: Palette },
    { id: "data", label: "Data", icon: Database },
  ];

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="card max-w-xs sm:max-w-md lg:max-w-4xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-hidden mx-2 sm:mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-3 sm:p-4 lg:p-6 border-b border-[#E5E7EB]">
          <h2 className="text-lg sm:text-xl font-semibold text-[#0B3558]">Settings</h2>
          <button
            onClick={onClose}
            className="text-[#A6BBD1] hover:text-[#0B3558] transition-colors p-1"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        <div className="flex flex-col lg:flex-row h-auto lg:h-[600px]">
          {/* Mobile Tab Bar */}
          <div className="lg:hidden bg-gray-50 border-b border-[#E5E7EB] p-2 overflow-x-auto">
            <nav className="flex space-x-1 min-w-max">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() =>
                      setActiveTab(
                        tab.id as
                          | "profile"
                          | "preferences"
                          | "security"
                          | "notifications"
                      )
                    }
                    className={`flex flex-col items-center space-y-1 px-3 py-2 rounded-lg text-xs font-medium transition-colors min-w-[80px] ${
                      activeTab === tab.id
                        ? "bg-[#006BFF] text-white"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="truncate">{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
          
          {/* Desktop Sidebar */}
          <div className="hidden lg:block w-64 bg-gray-50 border-r border-[#E5E7EB] p-4">
            <nav className="space-y-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() =>
                      setActiveTab(
                        tab.id as
                          | "profile"
                          | "preferences"
                          | "security"
                          | "notifications"
                      )
                    }
                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      activeTab === tab.id
                        ? "bg-[#006BFF] text-white"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1 p-3 sm:p-4 lg:p-6 overflow-y-auto max-h-[60vh] lg:max-h-none">
            {activeTab === "profile" && (
              <div className="space-y-4 sm:space-y-6">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                  Profile Settings
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={settings.profile.name}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          profile: {
                            ...settings.profile,
                            name: e.target.value,
                          },
                        })
                      }
                      className="input-field w-full"
                      placeholder="Enter your full name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={settings.profile.email}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          profile: {
                            ...settings.profile,
                            email: e.target.value,
                          },
                        })
                      }
                      className="input-field w-full"
                      placeholder="Enter your email"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Timezone
                    </label>
                    <select
                      value={settings.profile.timezone}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          profile: {
                            ...settings.profile,
                            timezone: e.target.value,
                          },
                        })
                      }
                      className="input-field w-full"
                    >
                      <option value="America/New_York">Eastern Time</option>
                      <option value="America/Chicago">Central Time</option>
                      <option value="America/Denver">Mountain Time</option>
                      <option value="America/Los_Angeles">Pacific Time</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "notifications" && (
              <div className="space-y-4 sm:space-y-6">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                  Notification Settings
                </h3>
                <div className="space-y-4">
                  {Object.entries(settings.notifications).map(
                    ([key, value]) => (
                      <div
                        key={key}
                        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 p-3 bg-white rounded-lg border border-gray-200"
                      >
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-gray-900 truncate">
                            {key
                              .replace(/([A-Z])/g, " $1")
                              .replace(/^./, (str) => str.toUpperCase())}
                          </h4>
                          <p className="text-xs sm:text-sm text-gray-500 mt-1">
                            {key === "emailNotifications" &&
                              "Receive notifications via email"}
                            {key === "pushNotifications" &&
                              "Receive push notifications"}
                            {key === "upcomingPayments" &&
                              "Get notified about upcoming payments"}
                            {key === "overduePayments" &&
                              "Get notified about overdue payments"}
                            {key === "weeklyReports" &&
                              "Receive weekly financial reports"}
                          </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={value}
                            onChange={(e) =>
                              setSettings({
                                ...settings,
                                notifications: {
                                  ...settings.notifications,
                                  [key]: e.target.checked,
                                },
                              })
                            }
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                    )
                  )}
                </div>
              </div>
            )}

            {activeTab === "privacy" && (
              <div className="space-y-4 sm:space-y-6">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                  Privacy Settings
                </h3>
                <div className="space-y-4">
                  {Object.entries(settings.privacy).map(([key, value]) => (
                    <div
                      key={key}
                      className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 p-3 bg-white rounded-lg border border-gray-200"
                    >
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-gray-900 truncate">
                          {key
                            .replace(/([A-Z])/g, " $1")
                            .replace(/^./, (str) => str.toUpperCase())}
                        </h4>
                        <p className="text-xs sm:text-sm text-gray-500 mt-1">
                          {key === "dataSharing" &&
                            "Allow sharing of anonymized data for research"}
                          {key === "analytics" &&
                            "Help improve the app by sharing usage analytics"}
                          {key === "marketing" &&
                            "Receive marketing emails and promotions"}
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={value}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              privacy: {
                                ...settings.privacy,
                                [key]: e.target.checked,
                              },
                            })
                          }
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "appearance" && (
              <div className="space-y-4 sm:space-y-6">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                  Appearance Settings
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Theme
                    </label>
                    <select
                      value={settings.appearance.theme}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          appearance: {
                            ...settings.appearance,
                            theme: e.target.value,
                          },
                        })
                      }
                      className="input-field w-full"
                    >
                      <option value="light">Light</option>
                      <option value="dark">Dark</option>
                      <option value="auto">Auto</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Currency
                    </label>
                    <select
                      value={settings.appearance.currency}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          appearance: {
                            ...settings.appearance,
                            currency: e.target.value,
                          },
                        })
                      }
                      className="input-field w-full"
                    >
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="GBP">GBP (£)</option>
                      <option value="CAD">CAD (C$)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date Format
                    </label>
                    <select
                      value={settings.appearance.dateFormat}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          appearance: {
                            ...settings.appearance,
                            dateFormat: e.target.value,
                          },
                        })
                      }
                      className="input-field w-full"
                    >
                      <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                      <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                      <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "data" && (
              <div className="space-y-4 sm:space-y-6">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                  Data Management
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Export Format
                    </label>
                    <select
                      value={settings.data.exportFormat}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          data: {
                            ...settings.data,
                            exportFormat: e.target.value,
                          },
                        })
                      }
                      className="input-field w-full"
                    >
                      <option value="csv">CSV</option>
                      <option value="json">JSON</option>
                      <option value="xlsx">Excel</option>
                    </select>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 p-3 bg-white rounded-lg border border-gray-200">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-gray-900">
                        Auto Backup
                      </h4>
                      <p className="text-xs sm:text-sm text-gray-500 mt-1">
                        Automatically backup your data weekly
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.data.autoBackup}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            data: {
                              ...settings.data,
                              autoBackup: e.target.checked,
                            },
                          })
                        }
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  <div className="pt-4">
                    <button
                      onClick={handleExport}
                      className="btn-primary inline-flex items-center space-x-2"
                    >
                      <Download className="w-4 h-4" />
                      <span>Export Data</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-col sm:flex-row justify-end gap-3 sm:space-x-3 p-3 sm:p-4 lg:p-6 border-t border-[#E5E7EB]">
          <button onClick={onClose} className="btn-secondary w-full sm:w-auto order-2 sm:order-1">
            Cancel
          </button>
          <button onClick={handleSave} className="btn-primary w-full sm:w-auto order-1 sm:order-2">
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
