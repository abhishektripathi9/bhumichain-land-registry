import express from "express";
import { allUpCitizenService } from "../services/allUpCitizenService.js";
import { liveGovDataService } from "../services/liveGovDataService.js";
import { RealApiFetcher } from "../services/realApiFetcher.js";

const router = express.Router();

/**
 * Health-Check & Live External API Diagnostic Route
 * GET /api/system/live-test?district=Chitrakoot&tehsil=Rajapur&block=Ramnagar&village=Bardwara
 * Also supports /api/debug/live-test
 */
router.get(["/live-test", "/debug/live-test"], async (req, res) => {
  try {
    const {
      district = "Chitrakoot",
      tehsil = "Rajapur",
      block = "Ramnagar",
      village = "Bardwara",
    } = req.query;

    const report = await RealApiFetcher.runLiveDiagnostics({
      district,
      tehsil,
      block,
      village,
    });

    return res.status(200).json(report);
  } catch (err) {
    return res.status(500).json({
      success: false,
      timestamp: new Date().toISOString(),
      error: `Live Diagnostic Pipeline Error: ${err.message}`,
    });
  }
});

/**
 * Diagnostic Block Harvest Verification Route
 * GET /api/system/verify-block?district=Banda&tehsil=Baberu&block=Baberu
 */
router.get("/verify-block", async (req, res) => {
  try {
    const { district = "Banda", tehsil = "Baberu", block = "Baberu", refresh = "false" } = req.query;
    const forceRefresh = refresh === "true" || refresh === "1";

    const result = await allUpCitizenService.fetchAllVillagesInBlock({
      district,
      tehsil,
      block,
      forceRefresh,
    });

    const villages = result.villages || [];

    return res.status(200).json({
      status: "ok",
      success: true,
      timestamp: new Date().toISOString(),
      district: result.district,
      tehsil: result.tehsil,
      block: result.block,
      pincode: result.pincode,
      totalVillages: result.totalVillages,
      sourcesUsed: result.sourcesUsed || ["OSM_OVERPASS_GIS", "INDIA_POST_API", "DATA_GOV_LGD"],
      fromCache: result.fromCache || false,
      sampleVillages: villages.slice(0, 15),
    });
  } catch (err) {
    return res.status(500).json({ status: "error", success: false, error: err.message });
  }
});

/**
 * API Diagnostic Status
 * GET /api/system/api-status
 */
router.get("/api-status", (req, res) => {
  const diag = liveGovDataService.getDiagnosticStatus();
  res.json({
    status: "ok",
    dataGovKeyLoaded: Boolean(process.env.DATA_GOV_API_KEY),
    overpassConnected: true,
    ...diag,
  });
});

export default router;
