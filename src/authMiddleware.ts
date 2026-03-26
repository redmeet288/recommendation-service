/// <reference path="./types/express.d.ts" />
import type { NextFunction, Request, Response } from "express";

function headerString(req: Request, name: string): string | undefined {
  const v = req.headers[name.toLowerCase()];
  if (Array.isArray(v)) return v[0];
  return typeof v === "string" ? v : undefined;
}

/**
 * Recommendation-service принимает идентификацию ТОЛЬКО так, как у тебя уже сделано в profile-service:
 * заголовки `X-User-Id` и `X-Roles` (это же прокидывает gateway / BFF).
 */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const xUserId = headerString(req, "x-user-id")?.trim();
  const xRoles = headerString(req, "x-roles")?.trim();

  if (!xUserId || !xRoles) {
    res.status(401).json({
      error: "Unauthorized",
      message: "Send X-User-Id and X-Roles headers (same contract as profile-service).",
    });
    return;
  }

  req.user = { userUuid: xUserId, roles: xRoles };
  next();
}
