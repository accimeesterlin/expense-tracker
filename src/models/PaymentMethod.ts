import mongoose, { Schema, Document, Types } from "mongoose";

export interface IPaymentMethod extends Document {
  userId: string;
  name: string;
  type:
    | "credit_card"
    | "debit_card"
    | "bank_account"
    | "digital_wallet"
    | "other";
  provider?: string; // Visa, Mastercard, Chase, etc.
  lastFourDigits?: string;
  expiryDate?: Date;
  isActive: boolean;
  isDefault: boolean;
  metadata?: {
    accountNumber?: string;
    routingNumber?: string;
    bankName?: string;
    cardholderName?: string;
    billingAddress?: {
      street?: string;
      city?: string;
      state?: string;
      zipCode?: string;
      country?: string;
    };
  };
  createdAt: Date;
  updatedAt: Date;
}

const PaymentMethodSchema: Schema = new Schema(
  {
    userId: {
      type: String,
      required: [true, "User ID is required"],
    },
    name: {
      type: String,
      required: [true, "Payment method name is required"],
      trim: true,
      maxlength: [100, "Name cannot exceed 100 characters"],
    },
    type: {
      type: String,
      required: [true, "Payment method type is required"],
      enum: [
        "credit_card",
        "debit_card",
        "bank_account",
        "digital_wallet",
        "other",
      ],
    },
    provider: {
      type: String,
      trim: true,
    },
    lastFourDigits: {
      type: String,
      trim: true,
      maxlength: [4, "Last four digits cannot exceed 4 characters"],
    },
    expiryDate: {
      type: Date,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
    metadata: {
      accountNumber: {
        type: String,
        trim: true,
      },
      routingNumber: {
        type: String,
        trim: true,
      },
      bankName: {
        type: String,
        trim: true,
      },
      cardholderName: {
        type: String,
        trim: true,
      },
      billingAddress: {
        street: {
          type: String,
          trim: true,
        },
        city: {
          type: String,
          trim: true,
        },
        state: {
          type: String,
          trim: true,
        },
        zipCode: {
          type: String,
          trim: true,
        },
        country: {
          type: String,
          trim: true,
          default: "United States",
        },
      },
    },
  },
  {
    timestamps: true,
  }
);

// Create indexes
PaymentMethodSchema.index({ userId: 1, isActive: 1 });
PaymentMethodSchema.index({ userId: 1, isDefault: 1 });

export default mongoose.models.PaymentMethod ||
  mongoose.model<IPaymentMethod>("PaymentMethod", PaymentMethodSchema);
