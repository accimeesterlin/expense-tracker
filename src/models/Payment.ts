import mongoose, { Schema, Document, Types } from "mongoose";

export interface IPayment extends Document {
  userId: string;
  type: "debt_payment" | "income_received";
  referenceId: Types.ObjectId; // Debt ID or Income ID
  amount: number;
  currency: string;
  paymentDate: Date;
  paymentMethod?: Types.ObjectId;
  company?: Types.ObjectId;
  category?: string;
  description?: string;
  receiptUrl?: string;
  receiptS3Key?: string;
  receiptFileName?: string;
  receiptContentType?: string;
  tags: string[];
  notes?: string;
  isAutomatic: boolean; // Whether this was recorded automatically or manually
  metadata?: {
    balanceBefore?: number;
    balanceAfter?: number;
    principalAmount?: number;
    interestAmount?: number;
    feesAmount?: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema: Schema = new Schema(
  {
    userId: {
      type: String,
      required: [true, "User ID is required"],
    },
    type: {
      type: String,
      required: [true, "Payment type is required"],
      enum: ["debt_payment", "income_received"],
    },
    referenceId: {
      type: Schema.Types.ObjectId,
      required: [true, "Reference ID is required"],
      refPath: "type",
    },
    amount: {
      type: Number,
      required: [true, "Amount is required"],
      min: [0, "Amount must be positive"],
    },
    currency: {
      type: String,
      required: [true, "Currency is required"],
      default: "USD",
      uppercase: true,
    },
    paymentDate: {
      type: Date,
      required: [true, "Payment date is required"],
    },
    paymentMethod: {
      type: Schema.Types.ObjectId,
      ref: "PaymentMethod",
    },
    company: {
      type: Schema.Types.ObjectId,
      ref: "Company",
    },
    category: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, "Description cannot exceed 500 characters"],
    },
    receiptUrl: {
      type: String,
      trim: true,
    },
    receiptS3Key: {
      type: String,
      trim: true,
    },
    receiptFileName: {
      type: String,
      trim: true,
    },
    receiptContentType: {
      type: String,
      trim: true,
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
    isAutomatic: {
      type: Boolean,
      default: false,
    },
    metadata: {
      balanceBefore: Number,
      balanceAfter: Number,
      principalAmount: Number,
      interestAmount: Number,
      feesAmount: Number,
    },
  },
  {
    timestamps: true,
  }
);

// Create indexes
PaymentSchema.index({ userId: 1, paymentDate: -1 });
PaymentSchema.index({ userId: 1, type: 1 });
PaymentSchema.index({ userId: 1, referenceId: 1 });
PaymentSchema.index({ userId: 1, company: 1 });
PaymentSchema.index({ userId: 1, category: 1 });

export default mongoose.models.Payment ||
  mongoose.model<IPayment>("Payment", PaymentSchema);