import express from "express";
import { getAiMetrics, retrainAiModel } from "../controllers/registrarController.js";

const router = express.Router();

router.get("/metrics", getAiMetrics);
router.post("/retrain", retrainAiModel);

export default router;
