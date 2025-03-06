import { Router } from "express";
import { createAudioUrl } from "./handlers/post";

const router = Router();

router.post("/", async (req, res) => await createAudioUrl(req, res));

export default router;