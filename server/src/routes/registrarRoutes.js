import express from "express";
import multer from "multer";
import {
  getPendingApplications,
  approveApplication,
  rejectApplication,
  getEscrowDeals,
  createEscrowDeal,
  releaseEscrowDeal,
  toggleDisputeFreeze,
  importData,
  uploadKhatauniPdf,
  fetchLiveUPOverpass,
  getAiMetrics,
  retrainAiModel,
} from "../controllers/registrarController.js";

const router = express.Router();
const upload = multer({ limits: { fileSize: 25 * 1024 * 1024 } }); // 25MB max file

// Pending verification queue
router.get("/pending", getPendingApplications);
router.post("/approve", approveApplication);
router.post("/reject", rejectApplication);

// Escrow settlement
router.get("/escrows", getEscrowDeals);
router.post("/escrow/create", createEscrowDeal);
router.post("/escrow/release", releaseEscrowDeal);

// Dispute control
router.post("/dispute", toggleDisputeFreeze);

// Multi-source Ingestion
router.post("/import-data", upload.single("file"), importData);
router.post("/upload-khatauni-pdf", upload.single("pdfFile"), uploadKhatauniPdf);
router.post("/fetch-live-up", fetchLiveUPOverpass);

// AI Model APIs
router.get("/ai-metrics", getAiMetrics);
router.post("/ai-retrain", retrainAiModel);

export default router;
