import express from "express";
import {
  getDistricts,
  getTehsils,
  getBlocks,
  getVillages,
  getLiveVillageDossier,
  getKhatauniNakal,
  importLgdVillages,
  getDataGovStatus,
  fetchDataGovVillages,
  liveVillageSearch,
  getPincode,
  getRealParcels,
  verifyBlockHarvest,
  getKhasraHistory,
} from "../controllers/bhulekhController.js";

const router = express.Router();

// 1. All 75 UP Districts
router.get("/districts", getDistricts);

// 2. Tehsils by District
router.get("/tehsils", getTehsils);

// 2.1 Blocks (विकास खंड) by District and optional Tehsil
router.get("/blocks", getBlocks);

// 3. Villages by Tehsil & Block (with 6-digit UP Revenue Code & live Overpass sync)
router.get("/villages", getVillages);

// 3.0 Atomic Live Village Dossier (Coordinates + Pincode + Satellite Boundaries + Khatauni)
router.get("/live-village-dossier", getLiveVillageDossier);

// 3.1 Statewide & Tehsil-Level Real-Time Nominatim / Cadastre Geocoded Search
router.get("/live-village-search", liveVillageSearch);

// 3.2 Live True Local Pincode Resolver (India Post API + OSM Nominatim)
router.get("/pincode", getPincode);

// 3.2.1 Diagnostic Block Harvest Verification
router.get("/verify-block", verifyBlockHarvest);

// 3.3 Real Satellite Khet Polygons via Overpass around Village Coordinates
router.get("/real-parcels", getRealParcels);

// 4. Official data.gov.in Government Open Data API status & live fetch
router.get("/data-gov/status", getDataGovStatus);
router.get("/data-gov/villages", fetchDataGovVillages);

// 5. Official LGD Directory CSV Importer
router.post("/import-lgd-villages", importLgdVillages);

// 6. Full 13-Column UP Bhulekh Khatauni Nakal Engine
router.get("/khatauni", getKhatauniNakal);

// 7. Complete Chronological Ownership History ("पहले किसकी थी → आज किसकी है")
router.get("/khasra-history", getKhasraHistory);

export default router;
