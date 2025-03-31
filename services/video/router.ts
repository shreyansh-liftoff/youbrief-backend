import { Router } from "express";
import { createVideoEntry } from "./handlers/post";
import { getPopularVideosByCategory, getTrendingVideos, getVideoDetails, getVideos } from "./handlers/get";
const router = Router();

router.post("/", async (req, res) => await createVideoEntry(req, res));
router.get("/", async (req, res) => await getVideoDetails(req, res));
router.get("/all", async (req, res) => await getVideos(req, res));
router.get("/trending-videos", async (req, res) => await getTrendingVideos(req, res));
router.get("/popular", async (req, res) => await getPopularVideosByCategory(req, res));

export default router;