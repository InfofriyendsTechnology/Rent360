import { Request, Response, NextFunction } from "express";
import responseHandler from "./responseHandler";
import { ObjectSchema } from "joi";

type ValidationSchemas = {
  body?: ObjectSchema;
  params?: ObjectSchema;
  query?: ObjectSchema;
};

const validator =
  (schemas: ValidationSchemas) =>
  (req: Request, res: Response, next: NextFunction) => {
    const types: { [key: string]: any } = {
      body: req.body,
      params: req.params,
      query: req.query,
    };

    for (const type of ["body", "params", "query"] as const) {
      if (!schemas[type]) continue;

      const schema = schemas[type] as ObjectSchema;
      const { error, value } = schema.validate(types[type], {
        allowUnknown: true,
        stripUnknown: true,
      });

      if (error) {
        return responseHandler.badRequest(res, error.message);
      }

      try {
        // @ts-ignore
        req[type] = value;
      } catch {
        Object.defineProperty(req, type, {
          value,
          writable: true,
          configurable: true,
          enumerable: true,
        });
      }
    }
    next();
  };

export default validator;
