import mongoose, { Schema, Document, Types } from "mongoose";

export interface ITeamMember extends Document {
  name: string;
  email: string;
  role: string;
  department?: string;
  phone?: string;
  avatar?: string;
  isActive: boolean;
  company: Types.ObjectId;
  userId: string;
  permissions?: string[];
  createdAt: Date;
  updatedAt: Date;
}

const TeamMemberSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Team member name is required"],
      trim: true,
      maxlength: [100, "Name cannot exceed 100 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      trim: true,
      lowercase: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please enter a valid email",
      ],
    },
    role: {
      type: String,
      required: [true, "Role is required"],
      trim: true,
      maxlength: [50, "Role cannot exceed 50 characters"],
    },
    department: {
      type: String,
      trim: true,
      maxlength: [50, "Department cannot exceed 50 characters"],
    },
    phone: {
      type: String,
      trim: true,
    },
    avatar: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    company: {
      type: Schema.Types.ObjectId,
      ref: "Company",
      required: [true, "Company reference is required"],
    },
    userId: {
      type: String,
      required: [true, "User ID is required"],
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
  },
  {
    timestamps: true,
  }
);

// Create compound index to ensure email is unique per company
TeamMemberSchema.index({ email: 1, company: 1 }, { unique: true });

// Create index for company and user lookups
TeamMemberSchema.index({ company: 1, userId: 1 });

export default mongoose.models.TeamMember ||
  mongoose.model<ITeamMember>("TeamMember", TeamMemberSchema);
