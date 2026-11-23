import express from "express";
import { KhasraHistoryService } from "../services/khasraHistoryService.js";
import { MarketplaceService } from "../services/marketplaceService.js";

const router = express.Router();

/**
 * Universal Land & QR Verification
 * GET /api/registry/verify/:id
 * GET /api/registry/verify?khasra=...&village=...&district=...
 */
async function handleVerify(req, res) {
  try {
    const certId = req.params.id || req.query.id || req.query.certificateId || req.query.search;
    const { district, tehsil, block, village, khasra } = req.query;

    let result = null;

    if (certId) {
      result = KhasraHistoryService.findByCertificateOrGata(certId);
      if (!result && certId.includes("UP-REV-")) {
        // Parse parts from UP-REV-2026-DIST-KHASRA
        const parts = certId.split("-");
        const kNo = parts[parts.length - 1] || "104";
        result = await KhasraHistoryService.resolveKhasraHistory({
          district: district || "Chitrakoot",
          tehsil: tehsil || "Rajapur",
          block: block || "Ramnagar",
          village: village || "Ramnagar",
          khasraNo: kNo,
        });
      }
    }

    if (!result && (khasra || village)) {
      result = await KhasraHistoryService.resolveKhasraHistory({
        district: district || "Chitrakoot",
        tehsil: tehsil || "Rajapur",
        block: block || "Ramnagar",
        village: village || "Ramnagar",
        khasraNo: khasra || "104",
      });
    }

    if (!result) {
      return res.status(404).json({
        success: false,
        message: "प्रमाण पत्र अथवा भूलेख विवरण नहीं मिला। कृपया वैध संख्या दर्ज करें।",
      });
    }

    const isDisputed = Boolean(result.currentOwner?.hasDispute || result.isDisputed);
    const hasLoan = Boolean(result.currentOwner?.hasLoan || result.hasBankLien);

    return res.status(200).json({
      success: true,
      verified: true,
      statusBadge: isDisputed
        ? "DISPUTED"
        : hasLoan
          ? "ENCUMBERED"
          : "VERIFIED_CLEAN",
      statusTextHindi: isDisputed
        ? "⚠ विवादित / न्यायालय में विचाराधीन"
        : hasLoan
          ? "⚠ कृषि ऋण सक्रिय (बैंक बंधक)"
          : "✓ प्रमाणित एवं विवाद-मुक्त (Clear Title)",
      record: result,
      certificateId: result.certificateId,
      currentOwner: result.currentOwner,
      pastOwners: result.pastOwners || [],
      fourSides: result.fourSides,
      area: result.area,
      pricing: result.pricing,
      pincode: result.pincode,
      postOfficeName: result.postOfficeName,
      location: `${result.village}, ${result.block}, ${result.tehsil}, ${result.district} - ${result.pincode}`,
      verifiedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error("Error in registry verify:", err);
    return res.status(500).json({
      success: false,
      message: "सत्यापन प्रक्रिया में तकनीकी समस्या आई।",
      error: err.message,
    });
  }
}

router.get("/verify/:id", handleVerify);
router.get("/verify", handleVerify);

/**
 * Direct Land Registration
 * POST /api/registry/register
 */
router.post("/register", async (req, res) => {
  try {
    const { district, tehsil, block, village, khasraNumber, khataNumber, buyerName, buyerFather, buyerPhone, salePrice } = req.body;

    if (!district || !tehsil || !village || !khasraNumber || !buyerName) {
      return res.status(400).json({
        success: false,
        message: "जिला, तहसील, गाँव, खसरा संख्या और क्रेता का नाम आवश्यक हैं।",
      });
    }

    const transferResult = await KhasraHistoryService.recordOwnershipTransfer({
      district,
      tehsil,
      block: block || tehsil,
      village,
      khasraNo: khasraNumber,
      newBuyerName: buyerName,
      newBuyerFather: buyerFather,
      newBuyerPhone: buyerPhone,
      salePrice: salePrice || 2500000,
    });

    return res.status(201).json({
      success: true,
      message: `गाटा सं. #${khasraNumber} का डिजिटल पंजीकरण व नामांतरण पूर्ण हुआ। नया ई-प्रमाण पत्र जारी किया गया।`,
      record: transferResult,
      certificateId: transferResult.certificateId,
      newOwner: transferResult.currentOwner,
      pastOwners: transferResult.pastOwners,
    });
  } catch (err) {
    console.error("Error in land registration:", err);
    return res.status(500).json({
      success: false,
      message: "पंजीकरण में त्रुटि आई।",
      error: err.message,
    });
  }
});

export default router;
