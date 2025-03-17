import { Router } from "express";
import { createAudioUrl } from "./handlers/post";
import { getAudio } from "./handlers/get";

const router = Router();

router.post("/", async (req, res) => await createAudioUrl(req, res));
router.get("/", async (req, res) => await getAudio(req, res));

export default router;