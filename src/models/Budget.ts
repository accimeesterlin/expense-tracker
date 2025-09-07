import mongoose, { Schema, Document } from "mongoose";

export interface IBudget extends Document {
  userId: string;
  name: string;
  description?: string;
  totalAmount: number;
  spentAmount: number;
  currency: string;
  category?: string;
  period: "weekly" | "monthly" | "quarterly" | "yearly";
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  alertThreshold: number; // percentage (e.g., 80 for 80%)
  createdAt: Date;
  updatedAt: Date;
}

const BudgetSchema: Schema = new Schema(
  {
    userId: {
      type: String,
      required: [true, "User ID is required"],
    },
    name: {
      type: String,
      required: [true, "Budget name is required"],
      trim: true,
      maxlength: [100, "Budget name cannot exceed 100 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, "Description cannot exceed 500 characters"],
    },
    totalAmount: {
      type: Number,
      required: [true, "Total amount is required"],
      min: [0, "Total amount must be positive"],
    },
    spentAmount: {
      type: Number,
      default: 0,
      min: [0, "Spent amount must be positive"],
    },
    currency: {
      type: String,
      required: [true, "Currency is required"],
      default: "USD",
      uppercase: true,
    },
    category: {
      type: String,
      trim: true,
    },
    period: {
      type: String,
      required: [true, "Period is required"],
      enum: ["weekly", "monthly", "quarterly", "yearly"],
    },
    startDate: {
      type: Date,
      required: [true, "Start date is required"],
    },
    endDate: {
      type: Date,
      required: [true, "End date is required"],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    alertThreshold: {
      type: Number,
      default: 80,
      min: [0, "Alert threshold must be positive"],
      max: [100, "Alert threshold cannot exceed 100%"],
    },
  },
  {
    timestamps: true,
  }
);

// Virtual for remaining amount
BudgetSchema.virtual("remainingAmount").get(function (this: any) {
  return Math.max(0, this.totalAmount - this.spentAmount);
});

// Virtual for percentage used
BudgetSchema.virtual("percentageUsed").get(function (this: any) {
  return this.totalAmount > 0 ? (this.spentAmount / this.totalAmount) * 100 : 0;
});

// Virtual for days remaining
BudgetSchema.virtual("daysRemaining").get(function (this: any) {
  const now = new Date();
  const endDate = new Date(this.endDate);
  const diffTime = endDate.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
});

// Create indexes
BudgetSchema.index({ userId: 1, startDate: -1 });
BudgetSchema.index({ userId: 1, isActive: 1 });
BudgetSchema.index({ userId: 1, category: 1 });

export default mongoose.models.Budget ||
  mongoose.model<IBudget>("Budget", BudgetSchema);