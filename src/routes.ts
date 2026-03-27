import { Router } from "express";
import type { GetRecommendationsForMe } from "./application/getRecommendationsForMe";
import { requireAuth } from "./authMiddleware";
import {
  createRecommendationsAllController,
  createRecommendationsBudgetController,
  createRecommendationsCursorController,
  createRecommendationsSeachController,
} from "./controllers/recommendationsController";

export function createRoutes(
  getRecommendations: GetRecommendationsForMe,
): Router {
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
  // router.get(
  //   "/recommendations/me/seach",
  //   requireAuth,
  //   createRecommendationsSeachController(getRecommendations),
  // );
  router.post(
    "/recommendations/me/search",
    requireAuth,
    createRecommendationsSeachController(getRecommendations),
  );
  router.post(
    "/recommendations/me/sort/budget",
    requireAuth,
    createRecommendationsBudgetController(getRecommendations),
  );

  return router;
}
