import jwt from "jsonwebtoken"
import User from "../models/User.js"

export async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || ""
    const token = header.startsWith("Bearer ") ? header.slice(7) : ""
    if (!token) return res.status(401).json({ message: "Not authorized: missing Bearer token" })

    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    const user = await User.findById(decoded.id).select("_id email role displayName")
    if (!user) return res.status(401).json({ message: "Not authorized" })

    req.user = {
      id: String(user._id),
      email: user.email,
      role: user.role,
      displayName: user.displayName,
    }

    next()
  } catch (e) {
    return res.status(401).json({ message: "Not authorized" })
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
