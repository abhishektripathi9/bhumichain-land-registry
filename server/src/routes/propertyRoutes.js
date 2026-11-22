import express from "express";
import {
  detectPropertyByGPS,
  getAllProperties,
  getPropertyById,
  registerProperty,
  toggleForSale,
  updatePropertyPrivacy,
} from "../controllers/propertyController.js";
import { requireWallet } from "../middleware/auth.js";

const router = express.Router();

// Geospatial detection (point-in-polygon)
router.get("/detect", detectPropertyByGPS);

// Catalog search and filter
router.get("/", getAllProperties);
router.get("/:id", getPropertyById);

// Registration & Management
router.post("/register", requireWallet, registerProperty);
router.patch("/:id/sale", requireWallet, toggleForSale);
router.patch("/:id/privacy", requireWallet, updatePropertyPrivacy);

export default router;
