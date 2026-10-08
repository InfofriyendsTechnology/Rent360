import Joi from "joi";
export const createUserSchema = Joi.object({
  name: Joi.string().required(),
  mobile: Joi.string().required(),
  password: Joi.string().required(),
  roleId: Joi.string().optional(),
  status: Joi.string().optional(),
  profile_pic: Joi.string().optional()
});
export const updateUserSchema = Joi.object({
  name: Joi.string().optional(),
  mobile: Joi.string().optional(),
  password: Joi.string().optional(),
  roleId: Joi.string().optional(),
  status: Joi.string().optional(),
  profile_pic: Joi.string().optional()
});
