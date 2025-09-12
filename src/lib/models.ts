// Centralized model registration for serverless environments
// This ensures all models are properly registered before they're used

import Company from '@/models/Company';
import Expense from '@/models/Expense';
import Category from '@/models/Category';
import Tag from '@/models/Tag';
import User from '@/models/User';

// Export all models to ensure they're registered
export {
  Company,
  Expense,
  Category,
  Tag,
  User
};

// Function to ensure all models are registered
export function ensureModelsRegistered() {
  // Simply importing the models above ensures they're registered
  // This function can be called at the start of API routes
  return {
    Company,
    Expense,
    Category,
    Tag,
    User
  };
}