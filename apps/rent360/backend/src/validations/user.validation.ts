import Joi from "joi";
export const createUserSchema = Joi.object({
  name: Joi.string().required(),
  mobile: Joi.string().required(),
  password: Joi.string().required(),
  roleId: Joi.string().allow(null, '').optional(),
  status: Joi.string().valid("ACTIVE", "INACTIVE").optional(),
  profile_pic: Joi.string().allow(null, '').optional()
});
export const updateUserSchema = Joi.object({
  name: Joi.string().optional(),
  mobile: Joi.string().optional(),
  password: Joi.string().optional(),
  roleId: Joi.string().allow(null, '').optional(),
  status: Joi.string().valid("ACTIVE", "INACTIVE").optional(),
  profile_pic: Joi.string().allow(null, '').optional()
});
