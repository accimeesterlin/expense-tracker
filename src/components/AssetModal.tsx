"use client";

import { useState, useEffect } from "react";
import {
  X,
  PiggyBank,
  Calendar,
  Building2,
  Car,
  Home,
  Gem,
} from "lucide-react";

interface Asset {
  _id: string;
  name: string;
  description?: string;
  type: string;
  category: string;
  currentValue: number;
  currency: string;
  purchaseDate?: string;
  purchasePrice?: number;
  appreciationRate?: number;
  isLiquid: boolean;
  location?: string;
  metadata?: {
    institution?: string;
    make?: string;
    model?: string;
    year?: number;
    address?: string;
  };
  isActive: boolean;
  tags: string[];
  notes?: string;
}

interface AssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  asset?: Asset | null;
  onSuccess: (asset: Asset) => void;
}

export default function AssetModal({
  isOpen,
  onClose,
  asset,
  onSuccess,
}: AssetModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("cash");
  const [category, setCategory] = useState("");
  const [currentValue, setCurrentValue] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [purchaseDate, setPurchaseDate] = useState("");
  const [purchasePrice, setPurchasePrice] = useState("");
  const [appreciationRate, setAppreciationRate] = useState("");
  const [isLiquid, setIsLiquid] = useState(false);
  const [location, setLocation] = useState("");
  const [institution, setInstitution] = useState("");
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [address, setAddress] = useState("");
  const [tags, setTags] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (asset) {
      setName(asset.name);
      setDescription(asset.description || "");
      setType(asset.type);
      setCategory(asset.category);
      setCurrentValue(asset.currentValue.toString());
      setCurrency(asset.currency);
      setPurchaseDate(
        asset.purchaseDate ? asset.purchaseDate.split("T")[0] : ""
      );
      setPurchasePrice(asset.purchasePrice?.toString() || "");
      setAppreciationRate(asset.appreciationRate?.toString() || "");
      setIsLiquid(asset.isLiquid);
      setLocation(asset.location || "");
      setInstitution(asset.metadata?.institution || "");
      setMake(asset.metadata?.make || "");
      setModel(asset.metadata?.model || "");
      setYear(asset.metadata?.year?.toString() || "");
      setAddress(asset.metadata?.address || "");
      setTags(asset.tags.join(", "));
      setNotes(asset.notes || "");
    } else {
      setName("");
      setDescription("");
      setType("cash");
      setCategory("");
      setCurrentValue("");
      setCurrency("USD");
      setPurchaseDate("");
      setPurchasePrice("");
      setAppreciationRate("");
      setIsLiquid(false);
      setLocation("");
      setInstitution("");
      setMake("");
      setModel("");
      setYear("");
      setAddress("");
      setTags("");
      setNotes("");
    }
    setError("");
  }, [asset]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setError("Asset name is required");
      return;
    }

    if (!currentValue || parseFloat(currentValue) <= 0) {
      setError("Current value must be greater than 0");
      return;
    }

    if (!category.trim()) {
      setError("Category is required");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const url = asset ? `/api/assets/${asset._id}` : "/api/assets";
      const method = asset ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || undefined,
          type,
          category: category.trim(),
          currentValue: parseFloat(currentValue),
          currency,
          purchaseDate: purchaseDate || undefined,
          purchasePrice: purchasePrice ? parseFloat(purchasePrice) : undefined,
          appreciationRate: appreciationRate
            ? parseFloat(appreciationRate)
            : undefined,
          isLiquid,
          location: location.trim() || undefined,
          metadata: {
            institution: institution.trim() || undefined,
            make: make.trim() || undefined,
            model: model.trim() || undefined,
            year: year ? parseInt(year) : undefined,
            address: address.trim() || undefined,
          },
          tags: tags
            .split(",")
            .map((tag) => tag.trim())
            .filter((tag) => tag),
          notes: notes.trim() || undefined,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        onSuccess(result);
        onClose();
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to save asset");
      }
    } catch (error) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "cash":
        return <PiggyBank className="w-5 h-5" />;
      case "investment":
        return <Building2 className="w-5 h-5" />;
      case "real_estate":
        return <Home className="w-5 h-5" />;
      case "vehicle":
        return <Car className="w-5 h-5" />;
      case "jewelry":
      case "art":
        return <Gem className="w-5 h-5" />;
      default:
        return <PiggyBank className="w-5 h-5" />;
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="card max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#E5E7EB]">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
              {getTypeIcon(type)}
            </div>
            <h2 className="text-xl font-semibold text-[#0B3558]">
              {asset ? "Edit Asset" : "Add Asset"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-[#A6BBD1] hover:text-[#0B3558] transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-[#0B3558] mb-2">
              Asset Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input-field w-full"
              placeholder="e.g., Chase Savings, Tesla Model 3, House"
              required
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#0B3558] mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input-field w-full"
              rows={3}
              placeholder="Optional description of this asset"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-[#0B3558] mb-2">
                Asset Type
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="input-field w-full"
              >
                <option value="cash">Cash</option>
                <option value="investment">Investment</option>
                <option value="real_estate">Real Estate</option>
                <option value="vehicle">Vehicle</option>
                <option value="jewelry">Jewelry</option>
                <option value="art">Art</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#0B3558] mb-2">
                Category *
              </label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="input-field w-full"
                placeholder="e.g., Savings Account, Stock Portfolio, Primary Residence"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-[#0B3558] mb-2">
                Current Value *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={currentValue}
                onChange={(e) => setCurrentValue(e.target.value)}
                className="input-field w-full"
                placeholder="0.00"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#0B3558] mb-2">
                Currency
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="input-field w-full"
              >
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
                <option value="CAD">CAD</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-[#0B3558] mb-2">
                Purchase Date
              </label>
              <div className="input-field-with-icon">
                <Calendar className="icon w-5 h-5" />
                <input
                  type="date"
                  value={purchaseDate}
                  onChange={(e) => setPurchaseDate(e.target.value)}
                  className="input-field w-full"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#0B3558] mb-2">
                Purchase Price
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={purchasePrice}
                onChange={(e) => setPurchasePrice(e.target.value)}
                className="input-field w-full"
                placeholder="0.00"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#0B3558] mb-2">
              Annual Appreciation Rate (%)
            </label>
            <input
              type="number"
              step="0.01"
              min="-100"
              max="1000"
              value={appreciationRate}
              onChange={(e) => setAppreciationRate(e.target.value)}
              className="input-field w-full"
              placeholder="0.00"
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="isLiquid"
              checked={isLiquid}
              onChange={(e) => setIsLiquid(e.target.checked)}
              className="h-4 w-4 text-green-600 focus:ring-green-600 border-gray-300 rounded"
            />
            <label
              htmlFor="isLiquid"
              className="ml-2 block text-sm text-[#0B3558]"
            >
              This asset is liquid (easily convertible to cash)
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#0B3558] mb-2">
              Location
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="input-field w-full"
              placeholder="e.g., New York, NY or Online"
            />
          </div>

          {/* Type-specific fields */}
          {(type === "cash" || type === "investment") && (
            <div>
              <label className="block text-sm font-medium text-[#0B3558] mb-2">
                Institution
              </label>
              <input
                type="text"
                value={institution}
                onChange={(e) => setInstitution(e.target.value)}
                className="input-field w-full"
                placeholder="e.g., Chase Bank, Vanguard, Fidelity"
              />
            </div>
          )}

          {type === "vehicle" && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-[#0B3558] mb-2">
                  Make
                </label>
                <input
                  type="text"
                  value={make}
                  onChange={(e) => setMake(e.target.value)}
                  className="input-field w-full"
                  placeholder="e.g., Toyota"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#0B3558] mb-2">
                  Model
                </label>
                <input
                  type="text"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="input-field w-full"
                  placeholder="e.g., Camry"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#0B3558] mb-2">
                  Year
                </label>
                <input
                  type="number"
                  min="1900"
                  max={new Date().getFullYear() + 1}
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  className="input-field w-full"
                  placeholder="2020"
                />
              </div>
            </div>
          )}

          {type === "real_estate" && (
            <div>
              <label className="block text-sm font-medium text-[#0B3558] mb-2">
                Address
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="input-field w-full"
                placeholder="123 Main St, City, State"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-[#0B3558] mb-2">
              Tags
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="input-field w-full"
              placeholder="e.g., emergency-fund, retirement, primary (comma separated)"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#0B3558] mb-2">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="input-field w-full"
              rows={3}
              placeholder="Additional notes about this asset"
            />
          </div>

          {/* Actions */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 btn-secondary"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 btn-primary"
              disabled={loading}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" />
              ) : asset ? (
                "Update"
              ) : (
                "Add"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
