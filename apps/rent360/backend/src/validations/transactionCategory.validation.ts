import Joi from "joi";

export const createTransactionCategorySchema = Joi.object({
  name: Joi.string().trim().required(),
  category_type: Joi.string().valid("INCOME", "EXPENSE").optional().allow("", null),
  contact_no: Joi.string().trim().optional().allow("", null),
  account_group: Joi.string().trim().optional().allow("", null),
  opening_balance: Joi.number().optional().allow(null),
  opening_date: Joi.date().iso().optional().allow("", null),
  address: Joi.string().trim().optional().allow("", null),
  remark: Joi.string().trim().optional().allow("", null),
  storeId: Joi.string().optional().allow("", null),
});

export const updateTransactionCategorySchema = Joi.object({
  name: Joi.string().trim().optional(),
  category_type: Joi.string().valid("INCOME", "EXPENSE").optional().allow("", null),
  contact_no: Joi.string().trim().optional().allow("", null),
  account_group: Joi.string().trim().optional().allow("", null),
  opening_balance: Joi.number().optional().allow(null),
  opening_date: Joi.date().iso().optional().allow("", null),
  address: Joi.string().trim().optional().allow("", null),
  remark: Joi.string().trim().optional().allow("", null),
  storeId: Joi.string().optional().allow("", null),
});
