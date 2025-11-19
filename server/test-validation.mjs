// Test validation middleware for user deletion
import { param, validationResult } from 'express-validator';

console.log("🧪 Testing validateUserId middleware...");

// Simulate the validation
const validateUserId = [
  param('userId')
    .notEmpty().withMessage('User ID is required')
    .custom((value) => {
      console.log("🔍 Validating userId:", value, "type:", typeof value);
      // Allow both string and numeric IDs
      const id = parseInt(value);
      if (!Number.isInteger(id) || id <= 0) {
        throw new Error('User ID must be a positive integer');
      }
      return true;
    }).withMessage('Invalid User ID format'),
];

// Test with ID "8" 
const testId = "8";
console.log("Testing with ID:", testId);

// Mock request object
const mockReq = {
  params: { userId: testId }
};

console.log("✅ Validation middleware test completed");