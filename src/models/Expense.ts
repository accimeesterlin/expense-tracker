import mongoose, { Schema, Document, Types } from "mongoose";

export interface IExpense extends Document {
  company: Types.ObjectId;
  name: string;
  description: string;
  amount: number;
  currency: string;
  category: string;
  expenseType: "subscription" | "one-time" | "recurring";
  frequency?: "monthly" | "quarterly" | "yearly" | "weekly" | "daily";
  startDate: Date;
  endDate?: Date;
  nextBillingDate?: Date;
  isActive: boolean;
  receiptUrl?: string;
  receiptS3Key?: string;
  receiptFileName?: string;
  receiptContentType?: string;
  paymentMethod?: Types.ObjectId;
  tags: string[];
  notes?: string;
  comments: Array<{
    text: string;
    createdAt: Date;
  }>;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

const ExpenseSchema: Schema = new Schema(
  {
    company: {
      type: Schema.Types.ObjectId,
      ref: "Company",
      required: [true, "Company reference is required"],
    },
    name: {
      type: String,
      required: [true, "Expense name is required"],
      trim: true,
      maxlength: [100, "Expense name cannot exceed 100 characters"],
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
      maxlength: [500, "Description cannot exceed 500 characters"],
    },
    amount: {
      type: Number,
      required: [true, "Amount is required"],
      min: [0, "Amount cannot be negative"],
    },
    currency: {
      type: String,
      required: [true, "Currency is required"],
      default: "USD",
      enum: ["USD", "EUR", "GBP", "CAD", "AUD", "JPY"],
    },
    category: {
      type: String,
      required: false, // Category is optional
      default: "Other",
      enum: [
        "Software & Subscriptions",
        "Office & Supplies",
        "Travel & Entertainment",
        "Marketing & Advertising",
        "Professional Services",
        "Insurance",
        "Utilities",
        "Rent & Leasing",
        "Equipment",
        "Other",
      ],
    },
    expenseType: {
      type: String,
      required: [true, "Expense type is required"],
      enum: ["subscription", "one-time", "recurring"],
    },
    frequency: {
      type: String,
      enum: ["monthly", "quarterly", "yearly", "weekly", "daily"],
      required: function (this: any) {
        return (
          this.expenseType === "subscription" ||
          this.expenseType === "recurring"
        );
      },
    },
    startDate: {
      type: Date,
      required: [true, "Start date is required"],
    },
    endDate: {
      type: Date,
    },
    nextBillingDate: {
      type: Date,
      required: function (this: any) {
        return (
          this.expenseType === "subscription" ||
          this.expenseType === "recurring"
        );
      },
    },
    isActive: {
      type: Boolean,
      default: true,
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
    comments: [
      {
        text: {
          type: String,
          required: true,
          trim: true,
          maxlength: [500, "Comment cannot exceed 500 characters"],
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    userId: {
      type: String,
      required: [true, "User ID is required"],
    },
  },
  {
    timestamps: true,
  }
);

// Create indexes for better query performance
ExpenseSchema.index({ company: 1, category: 1 });
ExpenseSchema.index({ company: 1, expenseType: 1 });
ExpenseSchema.index({ company: 1, nextBillingDate: 1 });
ExpenseSchema.index({ company: 1, isActive: 1 });

// Virtual for annual cost calculation
ExpenseSchema.virtual("annualCost").get(function (this: any) {
  if (this.frequency === "monthly") return this.amount * 12;
  if (this.frequency === "quarterly") return this.amount * 4;
  if (this.frequency === "yearly") return this.amount;
  if (this.frequency === "weekly") return this.amount * 52;
  if (this.frequency === "daily") return this.amount * 365;
  return this.amount;
});

// Ensure virtual fields are serialized
ExpenseSchema.set("toJSON", { virtuals: true });
ExpenseSchema.set("toObject", { virtuals: true });

export default mongoose.models.Expense ||
  mongoose.model<IExpense>("Expense", ExpenseSchema);
