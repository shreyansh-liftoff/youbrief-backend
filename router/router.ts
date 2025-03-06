import { Router } from "express";
import audioRouter from "../services/audio/router";
import summaryRouter from "../services/summary/router";
import videoRouter from "../services/video/router";

const router = Router();

router.use('/audio', audioRouter);
router.use('/video', videoRouter);
router.use('/summary', summaryRouter);

export default router;
