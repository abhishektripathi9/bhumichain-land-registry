import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import {
  importGeoJSON,
  getPendingVerifications,
  verifyProperty,
  toggleDispute,
  getEscrowDeals,
} from "../controllers/adminController.js";
import { requireRole } from "../middleware/auth.js";

const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const upload = multer({ dest: uploadDir });
const router = express.Router();

// Bulk GeoJSON / Cadastral Map Importer
router.post("/import-geojson", upload.single("geojsonFile"), importGeoJSON);

// Registrar Action Routes
router.get("/pending", getPendingVerifications);
router.post("/verify/:id", verifyProperty);
router.post("/dispute/:id", toggleDispute);
router.get("/escrow-deals", getEscrowDeals);

export default router;
