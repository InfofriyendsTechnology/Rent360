import Joi from "joi";

export const createStoreBankAccountSchema = Joi.object({
  account_name: Joi.string().trim().optional().allow("", null),
  name: Joi.string().trim().optional().allow("", null),
  account_number: Joi.string().trim().optional().allow("", null),
  ifsc_code: Joi.string().trim().optional().allow("", null),
  storeId: Joi.string().optional().allow("", null),
}).or("account_name", "name");

export const updateStoreBankAccountSchema = Joi.object({
  account_name: Joi.string().trim().optional().allow("", null),
  name: Joi.string().trim().optional().allow("", null),
  account_number: Joi.string().trim().optional().allow("", null),
  ifsc_code: Joi.string().trim().optional().allow("", null),
  storeId: Joi.string().optional().allow("", null),
});
