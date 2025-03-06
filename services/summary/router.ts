import { Router } from "express";
import { generateSummary } from "./handlers/post";

const router = Router();

router.post("/", async (req, res) => await generateSummary(req, res));

export default router;