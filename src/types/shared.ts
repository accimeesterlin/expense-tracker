export interface Company {
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

export interface PaymentMethod {
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

export interface Expense {
  _id: string;
  name: string;
  description?: string;
  amount: number;
  category: string;
  tags?: string[];
  expenseType: string;
  frequency?: string;
  startDate?: string;
  paymentDate?: string;
  nextBillingDate?: string;
  company: Company;
  isActive: boolean;
  receiptUrl?: string;
  receiptS3Key?: string;
  receiptFileName?: string;
  receiptContentType?: string;
  comments: Array<{
    text: string;
    createdAt: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface Income {
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

export interface Debt {
  _id: string;
  name: string;
  description?: string;
  originalAmount: number;
  currentBalance: number;
  currency: string;
  type: string;
  interestRate?: number;
  minimumPayment: number;
  paymentFrequency: string;
  nextPaymentDate: string;
  paymentMethod?: PaymentMethod;
  creditor?: string;
  accountNumber?: string;
  isActive: boolean;
  tags: string[];
  notes?: string;
}

export interface Asset {
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