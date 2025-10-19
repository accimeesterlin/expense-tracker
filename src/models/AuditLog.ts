import mongoose, { Document, Schema, Types } from "mongoose";

export interface IAuditLog extends Document {
  action: string;
  actorId: string;
  actorName?: string;
  actorEmail?: string;
  targetType: string;
  targetId?: string;
  targetName?: string;
  description?: string;
  company?: Types.ObjectId;
  teamMember?: Types.ObjectId;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    action: {
      type: String,
      required: true,
      trim: true,
    },
    actorId: {
      type: String,
      required: true,
      index: true,
    },
    actorName: {
      type: String,
      trim: true,
    },
    actorEmail: {
      type: String,
      trim: true,
      lowercase: true,
    },
    targetType: {
      type: String,
      required: true,
      trim: true,
    },
    targetId: {
      type: String,
      trim: true,
    },
    targetName: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    company: {
      type: Schema.Types.ObjectId,
      ref: "Company",
      index: true,
    },
    teamMember: {
      type: Schema.Types.ObjectId,
      ref: "TeamMember",
      index: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  }
);

AuditLogSchema.index({ action: 1 });
AuditLogSchema.index({ targetType: 1, targetId: 1 });
AuditLogSchema.index({ createdAt: -1 });

export default mongoose.models.AuditLog ||
  mongoose.model<IAuditLog>("AuditLog", AuditLogSchema);
