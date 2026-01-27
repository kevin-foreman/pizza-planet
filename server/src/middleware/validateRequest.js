/* UNUSED NOW */
export function validateRequest(validateFn) {
  return (req, res, next) => {
    try {
      const result = validateFn?.(req);

      // Support either throwing or returning an object with error
      if (result?.error) {
        const err = new Error("Validation failed");
        err.statusCode = 400;
        err.details = result.error;
        return next(err);
      }

      // Optional: allow validators to sanitize and return a value
      if (result?.value) req.validated = result.value;

      return next();
    } catch (e) {
      const err = new Error("Validation failed");
      err.statusCode = 400;
      err.details = e?.message || e;
      return next(err);
    }
  };
}