import Joi from "joi";

export const createTransactionCategorySchema = Joi.object({
  name: Joi.string().trim().required(),
  category_type: Joi.string().valid("INCOME", "EXPENSE").required(),
  storeId: Joi.string().optional().allow("", null),
});

export const updateTransactionCategorySchema = Joi.object({
  name: Joi.string().trim().optional(),
  category_type: Joi.string().valid("INCOME", "EXPENSE").optional(),
  storeId: Joi.string().optional().allow("", null),
});
