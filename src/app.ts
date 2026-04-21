import "dotenv/config";
/// <reference path="./types/express.d.ts" />
import express from "express";
import cors from "cors";
import { GetRecommendationsForMe } from "./application/getRecommendationsForMe";
import { createJobsClient } from "./infrastructure/externalJobsClient";
import { createProfileClient } from "./infrastructure/httpProfileClient";
import { createRoutes } from "./routes";

const jobs = createJobsClient();
const profiles = createProfileClient();
const getRecommendations = new GetRecommendationsForMe(profiles, jobs);

if (!profiles) {
  console.warn(
    "[recommendation-service] PROFILE_SERVICE_BASE_URL is missing; profile-dependent endpoints will fail",
  );
}

const app = express();
app.use(express.json());
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "x-user-id"],
  }),
);
app.use(createRoutes(getRecommendations));

const port = Number(process.env.PORT ?? 5004);

app.listen(port, () => {
  console.log(`[recommendation-service] listening on :${port}`);
});

export { app };
