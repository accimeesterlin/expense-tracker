import mongoose, { Schema, Document } from "mongoose";

export interface ITag extends Document {
  name: string;
  color?: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

const TagSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Tag name is required"],
      trim: true,
      maxlength: [30, "Tag name cannot exceed 30 characters"],
    },
    color: {
      type: String,
      default: "#6B7280",
      match: [/^#[0-9A-F]{6}$/i, "Please enter a valid hex color"],
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

// Create compound index to ensure tag names are unique per user
TagSchema.index({ name: 1, userId: 1 }, { unique: true });

export default mongoose.models.Tag ||
  mongoose.model<ITag>("Tag", TagSchema);