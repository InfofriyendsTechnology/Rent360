import Joi from "joi";

export const createProductSchema = Joi.object({
  name: Joi.string().trim().optional(),
  outfit_name: Joi.string().trim().optional(),
  categoryId: Joi.string().required(),
  storeId: Joi.string().optional().allow("", null),
  product_code: Joi.string().trim().optional().allow("", null),
  outfit_code: Joi.string().trim().optional().allow("", null),
  base_rent_price: Joi.number().min(0).required(),
  base_security_deposit: Joi.number().min(0).optional().default(0),
  images: Joi.alternatives().try(Joi.array().items(Joi.string()), Joi.string()).optional(),
  image_urls: Joi.alternatives().try(Joi.array().items(Joi.string()), Joi.string()).optional(),
  image: Joi.string().optional(),
  items: Joi.array()
    .items(
      Joi.object({
        size: Joi.string().optional().allow("", null),
        color: Joi.string().optional().allow("", null),
        sku_code: Joi.string().optional().allow("", null),
        status: Joi.string().optional().allow("", null),
        condition_notes: Joi.string().optional().allow("", null),
      })
    )
    .optional(),
});

export const updateProductSchema = Joi.object({
  name: Joi.string().trim().optional(),
  outfit_name: Joi.string().trim().optional(),
  categoryId: Joi.string().optional(),
  product_code: Joi.string().trim().optional().allow("", null),
  outfit_code: Joi.string().trim().optional().allow("", null),
  base_rent_price: Joi.number().min(0).optional(),
  base_security_deposit: Joi.number().min(0).optional(),
  images: Joi.alternatives().try(Joi.array().items(Joi.string()), Joi.string()).optional(),
  image_urls: Joi.alternatives().try(Joi.array().items(Joi.string()), Joi.string()).optional(),
  image: Joi.string().optional(),
});
