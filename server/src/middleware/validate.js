// Lightweight input validation — rejects bad payloads at the route boundary
// before they reach Mongoose, surfacing readable 400 errors.

export class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
    this.status = 400;
  }
}

export function assert(condition, message) {
  if (!condition) throw new ValidationError(message);
}

// validateBody({ key: { required, type, min, enum } }) -> middleware
export function validateBody(rules) {
  return (req, _res, next) => {
    try {
      for (const [key, rule] of Object.entries(rules)) {
        const value = req.body[key];
        const isMissing = value === undefined || value === null || value === '';
        if (rule.required && isMissing) {
          throw new ValidationError(`'${key}' is required`);
        }
        if (isMissing) continue;

        if (rule.type === 'number' && typeof value !== 'number') {
          throw new ValidationError(`'${key}' must be a number`);
        }
        if (rule.type === 'string' && typeof value !== 'string') {
          throw new ValidationError(`'${key}' must be a string`);
        }
        if (rule.min !== undefined && value < rule.min) {
          throw new ValidationError(`'${key}' must be >= ${rule.min}`);
        }
        if (rule.enum !== undefined && !rule.enum.includes(value)) {
          throw new ValidationError(`'${key}' must be one of [${rule.enum.join(', ')}]`);
        }
      }
      next();
    } catch (err) {
      next(err);
    }
  };
}
