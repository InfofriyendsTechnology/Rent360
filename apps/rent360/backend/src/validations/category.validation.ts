import Joi from "joi";

export const createCategorySchema = Joi.object({
  name: Joi.string().trim().required(),
  category_code: Joi.string().trim().optional().allow("", null),
  description: Joi.string().trim().optional().allow("", null),
  storeId: Joi.string().optional().allow("", null),
});

export const updateCategorySchema = Joi.object({
  name: Joi.string().trim().optional(),
  category_code: Joi.string().trim().optional().allow("", null),
  description: Joi.string().trim().optional().allow("", null),
});
