import Joi from "joi";

export const createTransactionSchema = Joi.object({
  storeId: Joi.string().optional().allow("", null),
  transaction_type: Joi.string().valid("CREDIT", "DEBIT").required(),
  amount: Joi.number().positive().required(),
  paymentModeId: Joi.string().required(),
  categoryId: Joi.string().optional().allow("", null),
  bankAccountId: Joi.string().optional().allow("", null),
  bookingId: Joi.string().optional().allow("", null),
  retailSaleId: Joi.string().optional().allow("", null),
  purchaseId: Joi.string().optional().allow("", null),
  reference_no: Joi.string().optional().allow("", null),
  remarks: Joi.string().optional().allow("", null),
  createdAt: Joi.date().iso().optional(),
});

export const updateTransactionSchema = Joi.object({
  transaction_type: Joi.string().valid("CREDIT", "DEBIT").optional(),
  amount: Joi.number().positive().optional(),
  paymentModeId: Joi.string().optional(),
  categoryId: Joi.string().optional().allow("", null),
  bankAccountId: Joi.string().optional().allow("", null),
  reference_no: Joi.string().optional().allow("", null),
  remarks: Joi.string().optional().allow("", null),
  createdAt: Joi.date().iso().optional(),
});
