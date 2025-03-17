import { Router } from "express";
import { generateSummary } from "./handlers/post";
import { getSummary } from "./handlers/get";

const router = Router();

router.post("/", async (req, res) => await generateSummary(req, res));
router.get("/", async (req, res) => await getSummary(req, res));

export default router;