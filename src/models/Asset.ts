import mongoose, { Schema, Document, Types } from "mongoose";

export interface IAsset extends Document {
  userId: string;
  name: string;
  description?: string;
  type:
    | "cash"
    | "investment"
    | "real_estate"
    | "vehicle"
    | "jewelry"
    | "art"
    | "other";
  category: string;
  currentValue: number;
  currency: string;
  purchaseDate?: Date;
  purchasePrice?: number;
  appreciationRate?: number; // Annual appreciation rate
  isLiquid: boolean; // Can be easily converted to cash
  location?: string;
  metadata?: {
    accountNumber?: string;
    institution?: string;
    make?: string;
    model?: string;
    year?: number;
    address?: string;
  };
  isActive: boolean;
  tags: string[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AssetSchema: Schema = new Schema(
  {
    userId: {
      type: String,
      required: [true, "User ID is required"],
    },
    name: {
      type: String,
      required: [true, "Asset name is required"],
      trim: true,
      maxlength: [100, "Name cannot exceed 100 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, "Description cannot exceed 500 characters"],
    },
    type: {
      type: String,
      required: [true, "Asset type is required"],
      enum: [
        "cash",
        "investment",
        "real_estate",
        "vehicle",
        "jewelry",
        "art",
        "other",
      ],
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      trim: true,
    },
    currentValue: {
      type: Number,
      required: [true, "Current value is required"],
      min: [0, "Current value must be positive"],
    },
    currency: {
      type: String,
      required: [true, "Currency is required"],
      default: "USD",
      uppercase: true,
    },
    purchaseDate: {
      type: Date,
    },
    purchasePrice: {
      type: Number,
      min: [0, "Purchase price must be positive"],
    },
    appreciationRate: {
      type: Number,
      min: [-100, "Appreciation rate cannot be less than -100%"],
      max: [1000, "Appreciation rate cannot exceed 1000%"],
    },
    isLiquid: {
      type: Boolean,
      default: false,
    },
    location: {
      type: String,
      trim: true,
    },
    metadata: {
      accountNumber: {
        type: String,
        trim: true,
      },
      institution: {
        type: String,
        trim: true,
      },
      make: {
        type: String,
        trim: true,
      },
      model: {
        type: String,
        trim: true,
      },
      year: {
        type: Number,
        min: [1900, "Year must be after 1900"],
        max: [new Date().getFullYear() + 1, "Year cannot be in the future"],
      },
      address: {
        type: String,
        trim: true,
      },
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

// Virtual for total gain/loss
AssetSchema.virtual("totalGainLoss").get(function (this: any) {
  if (!this.purchasePrice) return 0;
  return this.currentValue - this.purchasePrice;
});

// Virtual for gain/loss percentage
AssetSchema.virtual("gainLossPercentage").get(function (this: any) {
  if (!this.purchasePrice || this.purchasePrice === 0) return 0;
  return Math.round(
    ((this.currentValue - this.purchasePrice) / this.purchasePrice) * 100
  );
});

// Create indexes
AssetSchema.index({ userId: 1, type: 1 });
AssetSchema.index({ userId: 1, category: 1 });
AssetSchema.index({ userId: 1, isLiquid: 1 });
AssetSchema.index({ userId: 1, isActive: 1 });

export default mongoose.models.Asset ||
  mongoose.model<IAsset>("Asset", AssetSchema);
