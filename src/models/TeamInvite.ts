import mongoose, { Document, Schema } from "mongoose";

export interface ITeamInvite extends Document {
  email: string;
  token: string;
  inviterId: string;
  companyId: string;
  role: string;
  department?: string;
  phone?: string;
  permissions?: string[];
  isAccepted: boolean;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const TeamInviteSchema = new Schema<ITeamInvite>(
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
    inviterId: {
      type: String,
      required: true,
    },
    companyId: {
      type: Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },
    role: {
      type: String,
      required: true,
    },
    department: {
      type: String,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    permissions: [{
      type: String,
      enum: [
        'view_expenses',
        'create_expenses',
        'edit_expenses',
        'delete_expenses',
        'view_budgets',
        'create_budgets',
        'edit_budgets',
        'delete_budgets',
        'view_analytics',
        'manage_team',
        'manage_companies',
        'view_audit_logs',
        'admin_access'
      ]
    }],
    isAccepted: {
      type: Boolean,
      default: false,
    },
    expiresAt: {
      type: Date,
      required: true,
      default: function() {
        return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
      }
    },
  },
  {
    timestamps: true,
  }
);

// Create compound index for email and company
TeamInviteSchema.index({ email: 1, companyId: 1 });

// Index for expiration (token already has unique index from schema definition)
TeamInviteSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Ensure only one pending invite per email per company
TeamInviteSchema.index(
  { email: 1, companyId: 1, isAccepted: 1 },
  { 
    unique: true,
    partialFilterExpression: { isAccepted: false }
  }
);

export default mongoose.models.TeamInvite || mongoose.model<ITeamInvite>("TeamInvite", TeamInviteSchema);
