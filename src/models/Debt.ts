import mongoose, { Schema, Document, Types } from "mongoose";

export interface IDebt extends Document {
  userId: string;
  name: string;
  description?: string;
  originalAmount: number;
  currentBalance: number;
  currency: string;
  type:
    | "credit_card"
    | "personal_loan"
    | "mortgage"
    | "student_loan"
    | "car_loan"
    | "other";
  interestRate?: number;
  minimumPayment: number;
  paymentFrequency: "weekly" | "bi-weekly" | "monthly" | "quarterly" | "yearly";
  nextPaymentDate: Date;
  paymentMethod?: Types.ObjectId;
  creditor?: string;
  accountNumber?: string;
  isActive: boolean;
  tags: string[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const DebtSchema: Schema = new Schema(
  {
    userId: {
      type: String,
      required: [true, "User ID is required"],
    },
    name: {
      type: String,
      required: [true, "Debt name is required"],
      trim: true,
      maxlength: [100, "Name cannot exceed 100 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, "Description cannot exceed 500 characters"],
    },
    originalAmount: {
      type: Number,
      required: [true, "Original amount is required"],
      min: [0, "Original amount must be positive"],
    },
    currentBalance: {
      type: Number,
      required: [true, "Current balance is required"],
      min: [0, "Current balance must be positive"],
    },
    currency: {
      type: String,
      required: [true, "Currency is required"],
      default: "USD",
      uppercase: true,
    },
    type: {
      type: String,
      required: [true, "Debt type is required"],
      enum: [
        "credit_card",
        "personal_loan",
        "mortgage",
        "student_loan",
        "car_loan",
        "other",
      ],
    },
    interestRate: {
      type: Number,
      min: [0, "Interest rate must be positive"],
      max: [100, "Interest rate cannot exceed 100%"],
    },
    minimumPayment: {
      type: Number,
      required: [true, "Minimum payment is required"],
      min: [0, "Minimum payment must be positive"],
    },
    paymentFrequency: {
      type: String,
      required: [true, "Payment frequency is required"],
      enum: ["weekly", "bi-weekly", "monthly", "quarterly", "yearly"],
    },
    nextPaymentDate: {
      type: Date,
      required: [true, "Next payment date is required"],
    },
    paymentMethod: {
      type: Schema.Types.ObjectId,
      ref: "PaymentMethod",
    },
    creditor: {
      type: String,
      trim: true,
    },
    accountNumber: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    notes: {
      type: String,
      trim: true,
      maxlength: [1000, "Notes cannot exceed 1000 characters"],
    },
  },
  {
    timestamps: true,
  }
);

// Virtual for total paid amount
DebtSchema.virtual("totalPaid").get(function (this: any) {
  return this.originalAmount - this.currentBalance;
});

// Virtual for progress percentage
DebtSchema.virtual("progressPercentage").get(function (this: any) {
  if (this.originalAmount === 0) return 100;
  return Math.round((this.totalPaid / this.originalAmount) * 100);
});

// Create indexes
DebtSchema.index({ userId: 1, nextPaymentDate: 1 });
DebtSchema.index({ userId: 1, type: 1 });
DebtSchema.index({ userId: 1, isActive: 1 });

export default mongoose.models.Debt ||
  mongoose.model<IDebt>("Debt", DebtSchema);
