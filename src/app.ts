import "dotenv/config";
/// <reference path="./types/express.d.ts" />
import express from "express";
import { GetRecommendationsForMe } from "./application/getRecommendationsForMe";
import { createJobsClient } from "./infrastructure/externalJobsClient";
import { createProfileClient } from "./infrastructure/httpProfileClient";
import { createRoutes } from "./routes";

const jobs = createJobsClient();
const profiles = createProfileClient();
const getRecommendations = new GetRecommendationsForMe(profiles, jobs);

const app = express();
app.use(express.json());
app.use(createRoutes(getRecommendations));

const port = Number(process.env.PORT ?? 3002);

app.listen(port, () => {
  console.log(`[recommendation-service] listening on :${port}`);
});

export { app };
