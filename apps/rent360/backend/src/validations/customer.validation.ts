import Joi from "joi";

export const createCustomerSchema = Joi.object({
  full_name: Joi.string().min(2).max(100).required().messages({
    'string.empty': 'Full name is required',
    'string.min': 'Full name must be at least 2 characters long'
  }),
  mobile: Joi.string().pattern(/^[0-9]{10}$/).required().messages({
    'string.empty': 'Mobile number is required',
    'string.pattern.base': 'Mobile number must be exactly 10 digits'
  }),
  alternate_mobile: Joi.string().pattern(/^[0-9]{10}$/).allow('', null).optional().messages({
    'string.pattern.base': 'Alternate mobile must be exactly 10 digits'
  }),
  address: Joi.string().max(255).allow('', null).optional(),
  city: Joi.string().max(100).allow('', null).optional(),
  pincode: Joi.string().pattern(/^[0-9]{6}$/).allow('', null).optional().messages({
    'string.pattern.base': 'Pincode must be exactly 6 digits'
  }),
  reference_by: Joi.string().max(100).allow('', null).optional(),
});

export const updateCustomerSchema = Joi.object({
  full_name: Joi.string().min(2).max(100).optional().messages({
    'string.min': 'Full name must be at least 2 characters long'
  }),
  mobile: Joi.string().pattern(/^[0-9]{10}$/).optional().messages({
    'string.pattern.base': 'Mobile number must be exactly 10 digits'
  }),
  alternate_mobile: Joi.string().pattern(/^[0-9]{10}$/).allow('', null).optional().messages({
    'string.pattern.base': 'Alternate mobile must be exactly 10 digits'
  }),
  address: Joi.string().max(255).allow('', null).optional(),
  city: Joi.string().max(100).allow('', null).optional(),
  pincode: Joi.string().pattern(/^[0-9]{6}$/).allow('', null).optional().messages({
    'string.pattern.base': 'Pincode must be exactly 6 digits'
  }),
  reference_by: Joi.string().max(100).allow('', null).optional(),
});
