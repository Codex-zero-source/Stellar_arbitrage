/**
 * Comprehensive validation utilities for the Stellar Arbitrage application
 */

// Stellar address validation
export const validateStellarAddress = (address) => {
  if (!address || typeof address !== 'string') {
    return { isValid: false, error: 'Address is required' };
  }

  // Stellar public keys are 56 characters long and start with 'G'
  if (address.length !== 56) {
    return { isValid: false, error: 'Stellar address must be 56 characters long' };
  }

  if (!address.startsWith('G')) {
    return { isValid: false, error: 'Stellar address must start with "G"' };
  }

  // Basic character validation (Stellar uses base32 encoding)
  const validChars = /^[A-Z2-7]+$/;
  if (!validChars.test(address)) {
    return { isValid: false, error: 'Invalid characters in Stellar address' };
  }

  return { isValid: true, error: null };
};

// Amount validation for trading
export const validateAmount = (amount, min = 0, max = Infinity) => {
  if (amount === null || amount === undefined || amount === '') {
    return { isValid: false, error: 'Amount is required' };
  }

  const numAmount = parseFloat(amount);
  
  if (isNaN(numAmount)) {
    return { isValid: false, error: 'Amount must be a valid number' };
  }

  if (numAmount < 0) {
    return { isValid: false, error: 'Amount cannot be negative' };
  }

  if (numAmount < min) {
    return { isValid: false, error: `Amount must be at least ${min}` };
  }

  if (numAmount > max) {
    return { isValid: false, error: `Amount cannot exceed ${max}` };
  }

  // Check for reasonable decimal places (max 7 for Stellar)
  const decimalPlaces = (amount.toString().split('.')[1] || '').length;
  if (decimalPlaces > 7) {
    return { isValid: false, error: 'Amount cannot have more than 7 decimal places' };
  }

  return { isValid: true, error: null, value: numAmount };
};

// Percentage validation
export const validatePercentage = (percentage, min = 0, max = 100) => {
  const result = validateAmount(percentage, min, max);
  if (!result.isValid) {
    return result;
  }

  if (result.value > 100) {
    return { isValid: false, error: 'Percentage cannot exceed 100%' };
  }

  return result;
};

// Asset pair validation
export const validateAssetPair = (assetA, assetB) => {
  if (!assetA || !assetB) {
    return { isValid: false, error: 'Both assets are required' };
  }

  if (assetA === assetB) {
    return { isValid: false, error: 'Assets must be different' };
  }

  // Validate asset format (code:issuer or 'native' for XLM)
  const assetPattern = /^([A-Z0-9]{1,12}:[A-Z2-7]{56}|native)$/;
  
  if (assetA !== 'native' && !assetPattern.test(assetA)) {
    return { isValid: false, error: 'Invalid format for Asset A' };
  }

  if (assetB !== 'native' && !assetPattern.test(assetB)) {
    return { isValid: false, error: 'Invalid format for Asset B' };
  }

  return { isValid: true, error: null };
};

// Risk parameters validation
export const validateRiskParameters = (params) => {
  const errors = {};

  // Max position size
  if (params.maxPositionSize !== undefined) {
    const result = validateAmount(params.maxPositionSize, 0);
    if (!result.isValid) {
      errors.maxPositionSize = result.error;
    }
  }

  // Stop loss percentage
  if (params.stopLossPercentage !== undefined) {
    const result = validatePercentage(params.stopLossPercentage, 0, 50);
    if (!result.isValid) {
      errors.stopLossPercentage = result.error;
    }
  }

  // Max daily loss
  if (params.maxDailyLoss !== undefined) {
    const result = validateAmount(params.maxDailyLoss, 0);
    if (!result.isValid) {
      errors.maxDailyLoss = result.error;
    }
  }

  // Min profit threshold
  if (params.minProfitThreshold !== undefined) {
    const result = validateAmount(params.minProfitThreshold, 0);
    if (!result.isValid) {
      errors.minProfitThreshold = result.error;
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

// WebSocket message validation
export const validateWebSocketMessage = (message) => {
  try {
    const parsed = typeof message === 'string' ? JSON.parse(message) : message;
    
    if (!parsed || typeof parsed !== 'object') {
      return { isValid: false, error: 'Message must be a valid object' };
    }

    // Check for required command field
    if (!parsed.command || typeof parsed.command !== 'string') {
      return { isValid: false, error: 'Message must have a valid command field' };
    }

    return { isValid: true, error: null, data: parsed };
  } catch (error) {
    return { isValid: false, error: 'Invalid JSON format' };
  }
};

// API response validation
export const validateApiResponse = (response, expectedFields = []) => {
  if (!response || typeof response !== 'object') {
    return { isValid: false, error: 'Invalid response format' };
  }

  // Check for error field
  if (response.error) {
    return { isValid: false, error: response.error };
  }

  // Check for expected fields
  const missingFields = expectedFields.filter(field => !(field in response));
  if (missingFields.length > 0) {
    return { 
      isValid: false, 
      error: `Missing required fields: ${missingFields.join(', ')}` 
    };
  }

  return { isValid: true, error: null };
};

// Form validation helper
export const validateForm = (formData, validationRules) => {
  const errors = {};
  let isValid = true;

  for (const [field, rules] of Object.entries(validationRules)) {
    const value = formData[field];
    
    for (const rule of rules) {
      const result = rule(value);
      if (!result.isValid) {
        errors[field] = result.error;
        isValid = false;
        break; // Stop at first error for this field
      }
    }
  }

  return { isValid, errors };
};

// Common validation rules
export const validationRules = {
  required: (value) => {
    if (value === null || value === undefined || value === '') {
      return { isValid: false, error: 'This field is required' };
    }
    return { isValid: true, error: null };
  },

  email: (value) => {
    if (!value) return { isValid: true, error: null }; // Optional field
    
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(value)) {
      return { isValid: false, error: 'Invalid email format' };
    }
    return { isValid: true, error: null };
  },

  minLength: (min) => (value) => {
    if (!value) return { isValid: true, error: null }; // Optional field
    
    if (value.length < min) {
      return { isValid: false, error: `Must be at least ${min} characters long` };
    }
    return { isValid: true, error: null };
  },

  maxLength: (max) => (value) => {
    if (!value) return { isValid: true, error: null }; // Optional field
    
    if (value.length > max) {
      return { isValid: false, error: `Must be no more than ${max} characters long` };
    }
    return { isValid: true, error: null };
  },

  stellarAddress: validateStellarAddress,
  
  positiveNumber: (value) => validateAmount(value, 0.000001),
  
  percentage: (value) => validatePercentage(value)
};

// Sanitization utilities
export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  
  // Remove potentially dangerous characters
  return input
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim();
};

// Rate limiting helper
export const createRateLimiter = (maxRequests, timeWindow) => {
  const requests = new Map();
  
  return (identifier) => {
    const now = Date.now();
    const windowStart = now - timeWindow;
    
    // Clean old requests
    for (const [id, timestamps] of requests.entries()) {
      const validTimestamps = timestamps.filter(t => t > windowStart);
      if (validTimestamps.length === 0) {
        requests.delete(id);
      } else {
        requests.set(id, validTimestamps);
      }
    }
    
    // Check current identifier
    const userRequests = requests.get(identifier) || [];
    const recentRequests = userRequests.filter(t => t > windowStart);
    
    if (recentRequests.length >= maxRequests) {
      return { 
        allowed: false, 
        error: `Rate limit exceeded. Max ${maxRequests} requests per ${timeWindow}ms` 
      };
    }
    
    // Add current request
    recentRequests.push(now);
    requests.set(identifier, recentRequests);
    
    return { allowed: true, error: null };
  };
};

export default {
  validateStellarAddress,
  validateAmount,
  validatePercentage,
  validateAssetPair,
  validateRiskParameters,
  validateWebSocketMessage,
  validateApiResponse,
  validateForm,
  validationRules,
  sanitizeInput,
  createRateLimiter
};