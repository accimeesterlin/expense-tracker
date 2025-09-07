import mongoose, { Schema, Document, Types } from "mongoose";

export interface IIncome extends Document {
  userId: string;
  source: string;
  description?: string;
  amount: number;
  currency: string;
  frequency:
    | "one-time"
    | "weekly"
    | "bi-weekly"
    | "monthly"
    | "quarterly"
    | "yearly";
  category: string;
  paymentMethod?: Types.ObjectId;
  company?: Types.ObjectId;
  receivedDate: Date;
  nextPaymentDate?: Date;
  isRecurring: boolean;
  isActive: boolean;
  tags: string[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const IncomeSchema: Schema = new Schema(
  {
    userId: {
      type: String,
      required: [true, "User ID is required"],
    },
    source: {
      type: String,
      required: [true, "Income source is required"],
      trim: true,
      maxlength: [100, "Source cannot exceed 100 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, "Description cannot exceed 500 characters"],
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
    frequency: {
      type: String,
      required: [true, "Frequency is required"],
      enum: [
        "one-time",
        "weekly",
        "bi-weekly",
        "monthly",
        "quarterly",
        "yearly",
      ],
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      trim: true,
    },
    paymentMethod: {
      type: Schema.Types.ObjectId,
      ref: "PaymentMethod",
    },
    company: {
      type: Schema.Types.ObjectId,
      ref: "Company",
    },
    receivedDate: {
      type: Date,
      required: [true, "Received date is required"],
    },
    nextPaymentDate: {
      type: Date,
    },
    isRecurring: {
      type: Boolean,
      default: false,
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

// Virtual for annual income calculation
IncomeSchema.virtual("annualIncome").get(function (this: any) {
  if (this.frequency === "weekly") return this.amount * 52;
  if (this.frequency === "bi-weekly") return this.amount * 26;
  if (this.frequency === "monthly") return this.amount * 12;
  if (this.frequency === "quarterly") return this.amount * 4;
  if (this.frequency === "yearly") return this.amount;
  return this.amount;
});

// Create indexes
IncomeSchema.index({ userId: 1, receivedDate: -1 });
IncomeSchema.index({ userId: 1, category: 1 });
IncomeSchema.index({ userId: 1, isRecurring: 1 });
IncomeSchema.index({ userId: 1, isActive: 1 });

export default mongoose.models.Income ||
  mongoose.model<IIncome>("Income", IncomeSchema);
