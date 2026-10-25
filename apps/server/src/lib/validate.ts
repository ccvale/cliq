import { zValidator } from '@hono/zod-validator';
import { HTTPException } from 'hono/http-exception';
import type { ValidationTargets } from 'hono';
import type { ZodType } from 'zod';

/** zValidator that answers with the first readable issue instead of a raw zod dump. */
export const validate = <T extends ZodType, Target extends keyof ValidationTargets>(target: Target, schema: T) =>
  zValidator(target, schema, (result) => {
    if (!result.success) {
      throw new HTTPException(400, { message: result.error.issues[0]?.message ?? 'Invalid request' });
    }
  });
