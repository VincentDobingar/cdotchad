import { rateLimit, ipKeyGenerator } from "express-rate-limit";

export function buildRateLimits({ basePrefix = "/backend" } = {}) {
  const isAdminRequest = (req) => {
    const hasBearer = /^Bearer\s+.+/i.test(req.headers.authorization || "");
    return hasBearer && req.path.startsWith(`${basePrefix}/admin`);
  };

  const publicLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 100,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { error: "Too Many Requests", code: 429 },
    skip: (req) => isAdminRequest(req),
    keyGenerator: ipKeyGenerator, // ✅ IPv6-safe
  });

  const adminLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: Number(process.env.ADMIN_RATE_LIMIT_MAX || 2000),
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { error: "Too Many Requests (admin)", code: 429 },
    skip: (req) => !isAdminRequest(req),
    keyGenerator: ipKeyGenerator, // ✅
  });

  const authLimiter = rateLimit({
    windowMs: 10 * 60 * 1000,
    limit: 10,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { error: "Too Many Login Attempts", code: 429 },
    keyGenerator: ipKeyGenerator, // ✅
  });

  return { publicLimiter, adminLimiter, authLimiter };
}
