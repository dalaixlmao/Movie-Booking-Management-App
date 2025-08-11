import Joi from 'joi';

/**
 * Schema for user login
 */
export const loginSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .description('User email address'),
  
  password: Joi.string()
    .min(8)
    .required()
    .description('User password')
});

/**
 * Schema for user registration
 */
export const registerSchema = Joi.object({
  name: Joi.string()
    .min(2)
    .max(50)
    .required()
    .description('User full name'),
  
  email: Joi.string()
    .email()
    .required()
    .description('User email address'),
  
  password: Joi.string()
    .min(8)
    .required()
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .message('Password must contain at least one uppercase letter, one lowercase letter, and one number')
    .description('User password'),
  
  phone: Joi.string()
    .pattern(/^\+?[0-9]{10,15}$/)
    .required()
    .description('User phone number'),
  
  city: Joi.string()
    .max(50)
    .description('User city'),
  
  state: Joi.string()
    .max(50)
    .description('User state'),
  
  zip: Joi.string()
    .pattern(/^[0-9]{5,10}$/)
    .description('ZIP/Postal code')
});

/**
 * Schema for refresh token request
 */
export const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string()
    .required()
    .description('Refresh token')
});

/**
 * Schema for updating user profile
 */
export const updateProfileSchema = Joi.object({
  name: Joi.string()
    .min(2)
    .max(50)
    .description('User full name'),
  
  phone: Joi.string()
    .pattern(/^\+?[0-9]{10,15}$/)
    .description('User phone number'),
  
  city: Joi.string()
    .max(50)
    .description('User city'),
  
  state: Joi.string()
    .max(50)
    .description('User state'),
  
  zip: Joi.string()
    .pattern(/^[0-9]{5,10}$/)
    .description('ZIP/Postal code')
}).min(1);

/**
 * Schema for updating user password
 */
export const updatePasswordSchema = Joi.object({
  currentPassword: Joi.string()
    .required()
    .description('Current user password'),
  
  newPassword: Joi.string()
    .min(8)
    .required()
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .message('Password must contain at least one uppercase letter, one lowercase letter, and one number')
    .description('New password'),
  
  confirmPassword: Joi.string()
    .valid(Joi.ref('newPassword'))
    .required()
    .description('Confirm new password')
    .messages({ 'any.only': 'Passwords do not match' })
});