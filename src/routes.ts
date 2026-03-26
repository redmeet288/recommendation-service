import { Router } from "express";
import type { GetRecommendationsForMe } from "./application/getRecommendationsForMe";
import { requireAuth } from "./authMiddleware";
import {
  createRecommendationsAllController,
  createRecommendationsCursorController,
} from "./controllers/recommendationsController";

export function createRoutes(getRecommendations: GetRecommendationsForMe): Router {
  const router = Router();

  router.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  router.get(
    "/recommendations/me",
    requireAuth,
    createRecommendationsAllController(getRecommendations),
  );
  router.get(
    "/recommendations/me/cursor",
    requireAuth,
    createRecommendationsCursorController(getRecommendations),
  );

  return router;
}
