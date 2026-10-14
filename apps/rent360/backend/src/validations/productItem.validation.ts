import Joi from "joi";

export const createProductItemSchema = Joi.object({
  productId: Joi.string().required(),
  storeId: Joi.string().optional().allow("", null),
  sku_code: Joi.string().trim().optional().allow("", null),
  size: Joi.string().trim().optional().allow("", null),
  color: Joi.string().trim().optional().allow("", null),
  status: Joi.string().trim().optional().default("AVAILABLE"),
  condition_notes: Joi.string().trim().optional().allow("", null),
});

export const updateProductItemSchema = Joi.object({
  sku_code: Joi.string().trim().optional().allow("", null),
  size: Joi.string().trim().optional().allow("", null),
  color: Joi.string().trim().optional().allow("", null),
  status: Joi.string().trim().optional(),
  condition_notes: Joi.string().trim().optional().allow("", null),
});
