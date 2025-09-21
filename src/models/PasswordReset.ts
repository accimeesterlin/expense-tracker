import mongoose, { Document, Schema } from "mongoose";

export interface IPasswordReset extends Document {
  email: string;
  token: string;
  userId: string;
  expiresAt: Date;
  isUsed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const PasswordResetSchema = new Schema<IPasswordReset>(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    token: {
      type: String,
      required: true,
      unique: true,
    },
    userId: {
      type: String,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      default: function() {
        return new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now
      }
    },
    isUsed: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Index for email lookups and expiration cleanup
PasswordResetSchema.index({ email: 1 });
PasswordResetSchema.index({ token: 1 });
PasswordResetSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Ensure only one active reset token per user
PasswordResetSchema.index(
  { userId: 1, isUsed: 1 },
  { 
    unique: true,
    partialFilterExpression: { isUsed: false }
  }
);

export default mongoose.models.PasswordReset || mongoose.model<IPasswordReset>("PasswordReset", PasswordResetSchema);