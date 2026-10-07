import Joi from "joi";
export const createStoreSubscriptionSchema = Joi.object({
  storeId: Joi.string().required(),
  planId: Joi.string().required(),
  start_date: Joi.date().optional(),
  end_date: Joi.date().optional(),
  status: Joi.string().optional(),
  last_paid_amount: Joi.number().optional(),
}).unknown(true);
export const updateStoreSubscriptionSchema = Joi.object({}).unknown(true);
