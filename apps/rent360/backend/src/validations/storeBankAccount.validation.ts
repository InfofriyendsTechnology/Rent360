import Joi from "joi";

export const createStoreBankAccountSchema = Joi.object({
  account_name: Joi.string().trim().required(),
  account_number: Joi.string().trim().required(),
  ifsc_code: Joi.string().trim().optional().allow("", null),
  storeId: Joi.string().optional().allow("", null),
});

export const updateStoreBankAccountSchema = Joi.object({
  account_name: Joi.string().trim().optional(),
  account_number: Joi.string().trim().optional(),
  ifsc_code: Joi.string().trim().optional().allow("", null),
  storeId: Joi.string().optional().allow("", null),
});
