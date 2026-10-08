import Joi from "joi";
export const createRoleSchema = Joi.object({
  name: Joi.string().required(),
  permissions: Joi.array().items(Joi.string()).optional()
});
export const updateRoleSchema = Joi.object({
  name: Joi.string().optional(),
  permissions: Joi.array().items(Joi.string()).optional()
});
