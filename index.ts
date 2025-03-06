import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import { PORT } from "./config/env";
import router from "./router/router";
import cron from "node-cron";
import { refereshTrendingVideos } from "./jobs/cron";

const app = express();

app.use(cors());

app.use(bodyParser.json());

app.use("/api", router);

// Run the cron job every 24 hours
cron.schedule("0 0 * * *", async () => {
  console.log("Refreshing trending videos");
  await refereshTrendingVideos();
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
