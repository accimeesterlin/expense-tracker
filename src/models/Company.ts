import mongoose, { Schema, Document } from "mongoose";

export interface ICompany extends Document {
  name: string;
  industry?: string;
  domain?: string;
  brandId?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  contactInfo?: {
    email?: string;
    phone?: string;
    website?: string;
  };
  taxId?: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

const CompanySchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Company name is required"],
      trim: true,
      maxlength: [100, "Company name cannot exceed 100 characters"],
    },
    industry: {
      type: String,
      trim: true,
    },
    domain: {
      type: String,
      trim: true,
      lowercase: true,
    },
    brandId: {
      type: String,
      trim: true,
    },
    address: {
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
    contactInfo: {
      email: {
        type: String,
        trim: true,
        lowercase: true,
        match: [
          /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
          "Please enter a valid email",
        ],
      },
      phone: {
        type: String,
        trim: true,
      },
      website: {
        type: String,
        trim: true,
        required: false,
        match: [/^https?:\/\/.+/, "Please enter a valid URL"],
      },
    },
    taxId: {
      type: String,
      trim: true,
    },
    userId: {
      type: String,
      required: [true, "User ID is required"],
    },
  },
  {
    timestamps: true,
  }
);

// Create index for better search performance
CompanySchema.index({ name: "text", industry: "text" });

export default mongoose.models.Company ||
  mongoose.model<ICompany>("Company", CompanySchema);
