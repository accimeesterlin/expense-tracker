"use client";

import { useState, useEffect } from "react";
import { DollarSign, Calendar, Building2 } from "lucide-react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Company {
  _id: string;
  name: string;
  industry: string;
  description?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
  };
  contactInfo?: {
    email?: string;
    phone?: string;
    website?: string;
  };
  createdAt: string;
}

interface PaymentMethod {
  _id: string;
  name: string;
  type:
    | "credit_card"
    | "debit_card"
    | "bank_account"
    | "digital_wallet"
    | "other";
  provider?: string;
  lastFourDigits?: string;
  expiryDate?: string;
  isDefault: boolean;
  metadata?: {
    cardholderName?: string;
    bankName?: string;
  };
}

interface Income {
  _id: string;
  source: string;
  description?: string;
  amount: number;
  currency: string;
  frequency: string;
  category: string;
  paymentMethod?: PaymentMethod;
  company?: Company;
  receivedDate: string;
  nextPaymentDate?: string;
  isRecurring: boolean;
  isActive: boolean;
  tags: string[];
  notes?: string;
}

interface IncomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  income?: Income | null;
  companies: Company[];
  paymentMethods: PaymentMethod[];
  onSuccess: (income: Income) => void;
}

export default function IncomeModal({
  isOpen,
  onClose,
  income,
  companies,
  paymentMethods,
  onSuccess,
}: IncomeModalProps) {
  const [source, setSource] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [frequency, setFrequency] = useState("one-time");
  const [category, setCategory] = useState("");
  const [paymentMethodId, setPaymentMethodId] = useState("");
  const [companyId, setCompanyId] = useState("");
  const [receivedDate, setReceivedDate] = useState("");
  const [isRecurring, setIsRecurring] = useState(false);
  const [tags, setTags] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (income) {
      setSource(income.source);
      setDescription(income.description || "");
      setAmount(income.amount.toString());
      setCurrency(income.currency);
      setFrequency(income.frequency);
      setCategory(income.category);
      setPaymentMethodId(income.paymentMethod?._id || "");
      setCompanyId(income.company?._id || "");
      setReceivedDate(
        income.receivedDate ? income.receivedDate.split("T")[0] : ""
      );
      setIsRecurring(income.isRecurring);
      setTags(income.tags.join(", "));
      setNotes(income.notes || "");
    } else {
      setSource("");
      setDescription("");
      setAmount("");
      setCurrency("USD");
      setFrequency("one-time");
      setCategory("");
      setPaymentMethodId("");
      setCompanyId("");
      setReceivedDate(new Date().toISOString().split("T")[0]);
      setIsRecurring(false);
      setTags("");
      setNotes("");
    }
    setError("");
  }, [income]);

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

    if (!category.trim()) {
      setError("Category is required");
      return;
    }

    if (!receivedDate) {
      setError("Received date is required");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const url = income ? `/api/income/${income._id}` : "/api/income";
      const method = income ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          source: source.trim(),
          description: description.trim() || undefined,
          amount: parseFloat(amount),
          currency,
          frequency,
          category: category.trim(),
          paymentMethod: paymentMethodId || undefined,
          company: companyId || undefined,
          receivedDate,
          isRecurring,
          tags: tags
            .split(",")
            .map((tag) => tag.trim())
            .filter((tag) => tag),
          notes: notes.trim() || undefined,
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
        let errorMessage = "Failed to save income";
        try {
          const errorData = await response.json();
          console.log("Error response data:", errorData);
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch (parseError) {
          console.log("Failed to parse error response:", parseError);
          errorMessage = response.statusText || errorMessage;
        }
        console.error(
          "Income submission error:",
          response.status,
          errorMessage
        );
        setError(errorMessage);
      }
    } catch (error) {
      console.error("Income submission network error:", error);
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center space-x-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-600">
              <DollarSign className="h-5 w-5 text-white" />
            </div>
            <div>
              <DialogTitle>{income ? "Edit Income" : "Add Income"}</DialogTitle>
              <DialogDescription>
                {income ? "Update income details" : "Record a new income entry"}
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
            <div className="space-y-2">
              <Label htmlFor="source">
                Income Source <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Building2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="source"
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  placeholder="e.g., Salary, Freelance, Investment"
                  required
                  autoFocus
                  className="pl-9"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">
                Amount <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  required
                  className="pl-9"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Optional description of this income"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger id="currency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="GBP">GBP</SelectItem>
                  <SelectItem value="CAD">CAD</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="frequency">Frequency</Label>
              <Select value={frequency} onValueChange={setFrequency}>
                <SelectTrigger id="frequency">
                  <SelectValue />
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
              <Label htmlFor="category">
                Category <span className="text-destructive">*</span>
              </Label>
              <Input
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="e.g., Salary, Freelance"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="paymentMethod">Payment Method</Label>
              <Select
                value={paymentMethodId}
                onValueChange={setPaymentMethodId}
              >
                <SelectTrigger id="paymentMethod">
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {paymentMethods.map((method) => (
                    <SelectItem key={method._id} value={method._id}>
                      {method.name}{" "}
                      {method.lastFourDigits && `****${method.lastFourDigits}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="company">Company</Label>
              <Select value={companyId} onValueChange={setCompanyId}>
                <SelectTrigger id="company">
                  <SelectValue placeholder="Select company" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {companies.map((company) => (
                    <SelectItem key={company._id} value={company._id}>
                      {company.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="receivedDate">
              Received Date <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="receivedDate"
                type="date"
                value={receivedDate}
                onChange={(e) => setReceivedDate(e.target.value)}
                required
                className="pl-9"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="isRecurring"
              checked={isRecurring}
              onCheckedChange={(checked) => setIsRecurring(checked === true)}
            />
            <Label
              htmlFor="isRecurring"
              className="text-sm font-normal cursor-pointer"
            >
              This is recurring income
            </Label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">Tags</Label>
            <Input
              id="tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="e.g., bonus, commission, passive (comma separated)"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Additional notes about this income"
            />
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
                <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : income ? (
                "Update"
              ) : (
                "Add"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
