import Joi from "joi";

export const registerSchema = Joi.object({
  storeName: Joi.string().required().min(2).max(100),
  ownerName: Joi.string().required().min(2).max(100),
  mobile: Joi.string()
    .required()
    .pattern(/^[0-9]{10}$/)
    .messages({
      "string.pattern.base": "Mobile number must be exactly 10 digits",
    }),
  password: Joi.string().required().min(6),
});

export const loginSchema = Joi.object({
  mobile: Joi.string()
    .required()
    .pattern(/^[0-9]{10}$/)
    .messages({
      "string.pattern.base": "Mobile number must be exactly 10 digits",
    }),
  password: Joi.string().required(),
});
