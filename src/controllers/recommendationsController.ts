import type { Request, Response } from "express";
import type { GetRecommendationsForMe } from "../application/getRecommendationsForMe";
import { parseSubjectType } from "../domain/subjectType";

function headerString(req: Request, name: string): string | undefined {
  const v = req.headers[name.toLowerCase()];
  if (Array.isArray(v)) return v[0];
  return typeof v === "string" ? v : undefined;
}

function handleError(err: unknown, res: Response): void {
  const message = err instanceof Error ? err.message : "Unknown error";
  const isNotFound = message.includes("не удалось найти");
  const isBadCursor = message.includes("Invalid cursor");
  const status = isBadCursor ? 400 : isNotFound ? 404 : 500;
  res.status(status).json({ error: message });
}

export function createRecommendationsAllController(useCase: GetRecommendationsForMe) {
  return async function getRecommendationsMeAll(req: Request, res: Response): Promise<void> {
    const userUuid = req.user?.userUuid;
    if (!userUuid) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const subjectType = parseSubjectType(
      typeof req.query.subjectType === "string" ? req.query.subjectType : undefined,
    );
    if (!subjectType) {
      res.status(400).json({ error: "subjectType must be JOB" });
      return;
    }

    const xRoles = req.user?.roles;
    if (!xRoles) {
      res.status(401).json({ error: "Unauthorized", message: "Missing X-Roles" });
      return;
    }

    try {
      const items = await useCase.executeAll(userUuid, xRoles, subjectType);
      res.json({ items });
    } catch (err: unknown) {
      handleError(err, res);
    }
  };
}

export function createRecommendationsCursorController(useCase: GetRecommendationsForMe) {
  return async function getRecommendationsMeCursor(req: Request, res: Response): Promise<void> {
    const userUuid = req.user?.userUuid;
    if (!userUuid) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const subjectType = parseSubjectType(
      typeof req.query.subjectType === "string" ? req.query.subjectType : undefined,
    );
    if (!subjectType) {
      res.status(400).json({ error: "subjectType must be JOB" });
      return;
    }

    const xRoles = req.user?.roles;
    if (!xRoles) {
      res.status(401).json({ error: "Unauthorized", message: "Missing X-Roles" });
      return;
    }

    try {
      const xCursor = headerString(req, "x-cursor");
      const page = await useCase.executePaged(userUuid, xRoles, subjectType, xCursor);
      res.json(page);
    } catch (err: unknown) {
      handleError(err, res);
    }
  };
}
