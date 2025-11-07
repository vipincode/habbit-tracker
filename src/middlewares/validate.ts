import type { Request, Response, NextFunction } from "express";
import type { ZodType, ZodError, z } from "zod";
import { CustomError } from "../utils/custom-error.js";

// InferZod helps extract the output type from a schema or undefined
type InferZod<T extends ZodType | undefined> = T extends ZodType ? z.infer<T> : unknown;

// Define schema type with generics
type ValidationSchema<
  BodySchema extends ZodType | undefined = undefined,
  ParamsSchema extends ZodType | undefined = undefined,
  QuerySchema extends ZodType | undefined = undefined,
> = {
  body?: BodySchema;
  params?: ParamsSchema;
  query?: QuerySchema;
};

// 🧩 Strongly typed middleware generator
export const validate =
  <
    BodySchema extends ZodType | undefined = undefined,
    ParamsSchema extends ZodType | undefined = undefined,
    QuerySchema extends ZodType | undefined = undefined,
  >(
    schema: ValidationSchema<BodySchema, ParamsSchema, QuerySchema>
  ) =>
  (
    req: Request<InferZod<ParamsSchema>, any, InferZod<BodySchema>, InferZod<QuerySchema>>,
    _res: Response,
    next: NextFunction
  ) => {
    try {
      // ✅ Explicitly cast parsed results to their inferred types
      if (schema.body) req.body = schema.body.parse(req.body) as InferZod<BodySchema>;
      if (schema.query) req.query = schema.query.parse(req.query) as InferZod<QuerySchema>;
      if (schema.params) req.params = schema.params.parse(req.params) as InferZod<ParamsSchema>;

      next();
    } catch (err) {
      if (err instanceof Error && "issues" in err) {
        const zodErr = err as ZodError;
        const message = zodErr.issues
          .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
          .join(", ");
        return next(CustomError.BadRequest(message));
      }
      next(err);
    }
  };
