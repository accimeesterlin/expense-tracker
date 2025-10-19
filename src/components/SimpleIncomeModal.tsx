"use client";

import { useState, useEffect } from "react";
import { DollarSign, Calendar } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Income {
  _id: string;
  source: string;
  description?: string;
  amount: number;
  currency: string;
  frequency: string;
  category: string;
  paymentMethod?: {
    _id: string;
    name: string;
    type:
      | "credit_card"
      | "debit_card"
      | "bank_account"
      | "digital_wallet"
      | "other";
    lastFourDigits?: string;
    isDefault: boolean;
  };
  company?: {
    _id: string;
    name: string;
    industry: string;
    description?: string;
    address: {
      street?: string;
      city: string;
      state: string;
      zipCode?: string;
    };
    contactInfo: {
      email: string;
      phone?: string;
      website?: string;
    };
    createdAt: string;
  };
  receivedDate: string;
  nextPaymentDate?: string;
  isRecurring: boolean;
  isActive: boolean;
  tags: string[];
  notes?: string;
  createdAt: string;
}

interface SimpleIncomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (income: Income) => void;
  income?: Income;
}

export default function SimpleIncomeModal({
  isOpen,
  onClose,
  onSuccess,
  income,
}: SimpleIncomeModalProps) {
  const [source, setSource] = useState("");
  const [amount, setAmount] = useState("");
  const [frequency, setFrequency] = useState("monthly");
  const [receivedDate, setReceivedDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isEditing = !!income;

  useEffect(() => {
    if (isOpen) {
      if (income) {
        // Editing mode
        setSource(income.source || "");
        setAmount(income.amount?.toString() || "");
        setFrequency(income.frequency || "monthly");
        setReceivedDate(
          income.nextPaymentDate?.split("T")[0] ||
            new Date().toISOString().split("T")[0]
        );
      } else {
        // Create mode
        setSource("");
        setAmount("");
        setFrequency("monthly");
        setReceivedDate(new Date().toISOString().split("T")[0]);
      }
      setError("");
    }
  }, [isOpen, income]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!source.trim()) {
      setError("Income source is required");
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      setError("Amount must be greater than 0");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const url = isEditing ? `/api/income/${income._id}` : "/api/income";
      const method = isEditing ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          source: source.trim(),
          amount: parseFloat(amount),
          currency: "USD",
          frequency,
          category: "Income",
          receivedDate,
          isRecurring: frequency !== "one-time",
        }),
      });

      console.log("Response status:", response.status);
      console.log("Response ok:", response.ok);
      console.log(
        "Response headers:",
        Object.fromEntries(response.headers.entries())
      );

      if (response.ok) {
        const result = await response.json();
        console.log("Success response:", result);
        onSuccess(result);
        onClose();
      } else {
        try {
          const errorData = await response.json();
          console.log("Error response data:", errorData);
          setError(errorData.error || "Failed to save income");
        } catch (parseError) {
          console.log("Failed to parse error response:", parseError);
          setError("Failed to save income");
        }
      }
    } catch (error) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-white" />
            </div>
            <DialogTitle>
              {isEditing ? "Edit Income" : "Add Income"}
            </DialogTitle>
          </div>
          <DialogDescription>
            {isEditing
              ? "Update your income details below."
              : "Add a new income source to track your earnings."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="source">Income Source *</Label>
            <Input
              id="source"
              type="text"
              value={source}
              onChange={(e) => setSource(e.target.value)}
              placeholder="e.g., Salary, Freelance, Investment"
              required
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Amount *</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-9"
                placeholder="0.00"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="frequency">Frequency</Label>
            <Select value={frequency} onValueChange={setFrequency}>
              <SelectTrigger id="frequency">
                <SelectValue placeholder="Select frequency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="one-time">One-time</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="bi-weekly">Bi-weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="quarterly">Quarterly</SelectItem>
                <SelectItem value="yearly">Yearly</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="receivedDate">Received Date *</Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="receivedDate"
                type="date"
                value={receivedDate}
                onChange={(e) => setReceivedDate(e.target.value)}
                className="pl-9"
                required
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                  Saving...
                </>
              ) : isEditing ? (
                "Update Income"
              ) : (
                "Add Income"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
