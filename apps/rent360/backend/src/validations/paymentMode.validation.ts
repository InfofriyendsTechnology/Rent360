import Joi from "joi";

export const createPaymentModeSchema = Joi.object({
  name: Joi.string().trim().required(),
  storeId: Joi.string().optional().allow("", null),
  is_active: Joi.boolean().optional(),
});

export const updatePaymentModeSchema = Joi.object({
  name: Joi.string().trim().optional(),
  storeId: Joi.string().optional().allow("", null),
  is_active: Joi.boolean().optional(),
});
