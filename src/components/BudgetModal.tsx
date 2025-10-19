"use client";

import { useState, useEffect } from "react";
import { DollarSign } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Budget {
  _id: string;
  name: string;
  description?: string;
  totalAmount: number;
  spentAmount: number;
  currency: string;
  category?: string;
  period: "weekly" | "monthly" | "quarterly" | "yearly";
  startDate: string;
  endDate: string;
  isActive: boolean;
  alertThreshold: number;
  remainingAmount: number;
  percentageUsed: number;
  daysRemaining: number;
}

interface BudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (budget: Budget) => void;
  budget?: Budget;
}

export default function BudgetModal({
  isOpen,
  onClose,
  onSuccess,
  budget,
}: BudgetModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [period, setPeriod] = useState<
    "weekly" | "monthly" | "quarterly" | "yearly"
  >("monthly");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [category, setCategory] = useState("");
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isEditing = !!budget;

  useEffect(() => {
    if (isOpen) {
      fetchCategories();
      if (budget) {
        // Editing mode
        setName(budget.name || "");
        setDescription(budget.description || "");
        setTotalAmount(budget.totalAmount?.toString() || "");
        setPeriod(budget.period || "monthly");
        setStartDate(budget.startDate?.split("T")[0] || "");
        setEndDate(budget.endDate?.split("T")[0] || "");
        setCategory(budget.category || "");
      } else {
        // Create mode
        const today = new Date();
        const nextMonth = new Date(
          today.getFullYear(),
          today.getMonth() + 1,
          today.getDate()
        );

        setName("");
        setDescription("");
        setTotalAmount("");
        setPeriod("monthly");
        setStartDate(today.toISOString().split("T")[0]);
        setEndDate(nextMonth.toISOString().split("T")[0]);
        setCategory("");
      }
      setError("");
    }
  }, [isOpen, budget]);

  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/categories");
      if (response.ok) {
        const data = await response.json();
        const categoryNames = data.map((cat: { name: string }) => cat.name);
        setCategories(categoryNames);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !totalAmount || !startDate || !endDate) {
      setError("Please fill in all required fields");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const budgetData = {
        name: name.trim(),
        description: description.trim(),
        totalAmount: parseFloat(totalAmount),
        period,
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
        category: category.trim(),
        currency: "USD",
        spentAmount: budget?.spentAmount || 0,
        isActive: true,
      };

      const url = isEditing ? `/api/budgets/${budget._id}` : "/api/budgets";
      const method = isEditing ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(budgetData),
      });

      const data = await response.json();

      if (response.ok) {
        onSuccess(data);
        onClose();
      } else {
        setError(data.error || "Failed to save budget");
      }
    } catch (error) {
      console.error("Error saving budget:", error);
      setError("Failed to save budget. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <DollarSign className="h-6 w-6 text-primary" />
            </div>
            <div>
              <DialogTitle>
                {isEditing ? "Edit Budget" : "Create New Budget"}
              </DialogTitle>
              <DialogDescription>
                {isEditing
                  ? "Update budget details"
                  : "Set up a new spending budget"}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2 md:col-span-1">
              <Label htmlFor="name">
                Budget Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Monthly Groceries"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger id="category">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No category</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Optional description of this budget..."
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="amount">
                Budget Amount <span className="text-destructive">*</span>
              </Label>
              <Input
                id="amount"
                type="number"
                value={totalAmount}
                onChange={(e) => setTotalAmount(e.target.value)}
                placeholder="1000"
                step="0.01"
                min="0"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="period">Period</Label>
              <Select
                value={period}
                onValueChange={(value) =>
                  setPeriod(
                    value as "weekly" | "monthly" | "quarterly" | "yearly"
                  )
                }
              >
                <SelectTrigger id="period">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="startDate">
                Start Date <span className="text-destructive">*</span>
              </Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate">
                End Date <span className="text-destructive">*</span>
              </Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
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
              {loading
                ? "Saving..."
                : isEditing
                  ? "Update Budget"
                  : "Create Budget"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
