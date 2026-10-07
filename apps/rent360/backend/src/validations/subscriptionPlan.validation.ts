import Joi from "joi";

export const createSubscriptionPlanSchema = Joi.object({
  name: Joi.string().required(),
  price_per_month: Joi.number().min(0).required(),
  price_per_year: Joi.number().min(0).required(),
  max_bookings: Joi.number().integer().min(0).optional(),
  max_staff: Joi.number().integer().min(0).optional(),
  features: Joi.any().optional(),
  is_active: Joi.boolean().optional(),
}).unknown(true);

export const updateSubscriptionPlanSchema = Joi.object({
  name: Joi.string().optional(),
  price_per_month: Joi.number().min(0).optional(),
  price_per_year: Joi.number().min(0).optional(),
  max_bookings: Joi.number().integer().min(0).optional(),
  max_staff: Joi.number().integer().min(0).optional(),
  features: Joi.any().optional(),
  is_active: Joi.boolean().optional(),
}).unknown(true);
