import mongoose, { Schema, Document } from "mongoose";

export interface IGoal extends Document {
  userId: string;
  name: string;
  description?: string;
  targetAmount: number;
  currentAmount: number;
  currency: string;
  goalType: "savings" | "debt_payoff" | "investment" | "emergency_fund" | "other";
  targetDate: Date;
  priority: "low" | "medium" | "high";
  isCompleted: boolean;
  isActive: boolean;
  milestones: {
    amount: number;
    date: Date;
    achieved: boolean;
    achievedDate?: Date;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const GoalSchema: Schema = new Schema(
  {
    userId: {
      type: String,
      required: [true, "User ID is required"],
    },
    name: {
      type: String,
      required: [true, "Goal name is required"],
      trim: true,
      maxlength: [100, "Goal name cannot exceed 100 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, "Description cannot exceed 500 characters"],
    },
    targetAmount: {
      type: Number,
      required: [true, "Target amount is required"],
      min: [0, "Target amount must be positive"],
    },
    currentAmount: {
      type: Number,
      default: 0,
      min: [0, "Current amount must be positive"],
    },
    currency: {
      type: String,
      required: [true, "Currency is required"],
      default: "USD",
      uppercase: true,
    },
    goalType: {
      type: String,
      required: [true, "Goal type is required"],
      enum: ["savings", "debt_payoff", "investment", "emergency_fund", "other"],
    },
    targetDate: {
      type: Date,
      required: [true, "Target date is required"],
    },
    priority: {
      type: String,
      required: [true, "Priority is required"],
      enum: ["low", "medium", "high"],
      default: "medium",
    },
    isCompleted: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    milestones: [
      {
        amount: {
          type: Number,
          required: true,
        },
        date: {
          type: Date,
          required: true,
        },
        achieved: {
          type: Boolean,
          default: false,
        },
        achievedDate: {
          type: Date,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Virtual for remaining amount
GoalSchema.virtual("remainingAmount").get(function (this: any) {
  return Math.max(0, this.targetAmount - this.currentAmount);
});

// Virtual for percentage completed
GoalSchema.virtual("percentageCompleted").get(function (this: any) {
  return this.targetAmount > 0 ? (this.currentAmount / this.targetAmount) * 100 : 0;
});

// Virtual for days remaining
GoalSchema.virtual("daysRemaining").get(function (this: any) {
  const now = new Date();
  const targetDate = new Date(this.targetDate);
  const diffTime = targetDate.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
});

// Virtual for required monthly savings
GoalSchema.virtual("requiredMonthlySavings").get(function (this: any) {
  const remaining = this.remainingAmount;
  const monthsRemaining = Math.max(1, this.daysRemaining / 30.44); // Average days per month
  return remaining / monthsRemaining;
});

// Create indexes
GoalSchema.index({ userId: 1, targetDate: 1 });
GoalSchema.index({ userId: 1, isActive: 1 });
GoalSchema.index({ userId: 1, goalType: 1 });
GoalSchema.index({ userId: 1, priority: 1 });

export default mongoose.models.Goal ||
  mongoose.model<IGoal>("Goal", GoalSchema);