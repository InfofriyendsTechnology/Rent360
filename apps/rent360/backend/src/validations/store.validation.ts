import Joi from "joi";
export const createStoreSchema = Joi.object({
  name: Joi.string().required(),
  owner_name: Joi.string().required(),
  mobile: Joi.string().required()
}).unknown(true);
export const updateStoreSchema = Joi.object({}).unknown(true);
