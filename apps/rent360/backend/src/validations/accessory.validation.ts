import Joi from "joi";

export const createAccessorySchema = Joi.object({
  name: Joi.string().trim().optional(),
  item_name: Joi.string().trim().optional(),
  categoryId: Joi.string().optional().allow("", null),
  item_type: Joi.string().optional().allow("", null),
  image_url: Joi.string().optional().allow("", null),
  rent_price: Joi.number().min(0).optional(),
  total_stock: Joi.number().min(0).optional(),
  alert_limit: Joi.number().min(0).optional(),
  is_sold: Joi.boolean().optional(),
  storeId: Joi.string().optional().allow("", null),
});

export const updateAccessorySchema = Joi.object({
  name: Joi.string().trim().optional(),
  item_name: Joi.string().trim().optional(),
  categoryId: Joi.string().optional().allow("", null),
  item_type: Joi.string().optional().allow("", null),
  image_url: Joi.string().optional().allow("", null),
  rent_price: Joi.number().min(0).optional(),
  total_stock: Joi.number().min(0).optional(),
  alert_limit: Joi.number().min(0).optional(),
  is_sold: Joi.boolean().optional(),
});
