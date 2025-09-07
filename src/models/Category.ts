import mongoose, { Schema, Document } from "mongoose";

export interface ICategory extends Document {
  name: string;
  description?: string;
  color?: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

const CategorySchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Category name is required"],
      trim: true,
      maxlength: [50, "Category name cannot exceed 50 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [200, "Description cannot exceed 200 characters"],
    },
    color: {
      type: String,
      default: "#006BFF",
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

// Create compound index to ensure category names are unique per user
CategorySchema.index({ name: 1, userId: 1 }, { unique: true });

export default mongoose.models.Category ||
  mongoose.model<ICategory>("Category", CategorySchema);