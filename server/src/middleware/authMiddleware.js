import jwt from "jsonwebtoken";

export function requireAuth(req, res, next) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    const err = new Error("Not authorized: missing Bearer token");
    err.statusCode = 401;
    return next(err);
  }

  const token = header.split(" ")[1];
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    const err = new Error("Server misconfiguration: JWT_SECRET is not set");
    err.statusCode = 500;
    return next(err);
  }

  try {
    const payload = jwt.verify(token, secret);
    req.user = payload; // { id, email, roles, ... } depending on what you sign
    return next();
  } catch {
    const err = new Error("Not authorized: token invalid or expired");
    err.statusCode = 401;
    return next(err);
  }
}

export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      const err = new Error("Not authorized");
      err.statusCode = 401;
      return next(err);
    }

    const roles = Array.isArray(req.user?.roles)
      ? req.user.roles
      : req.user?.role
        ? [req.user.role]
        : [];

    const ok = allowedRoles.some((r) => roles.includes(r));

    if (!ok) {
      const err = new Error("Forbidden");
      err.statusCode = 403;
      return next(err);
    }

    return next();
  };
}
