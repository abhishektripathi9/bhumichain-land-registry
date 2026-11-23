import express from "express";
import { MarketplaceService } from "../services/marketplaceService.js";
import { KhasraHistoryService } from "../services/khasraHistoryService.js";

const router = express.Router();

/**
 * GET /api/marketplace/listings - Get all available lands for sale
 */
router.get("/listings", async (req, res) => {
  try {
    const { district, tehsil, search, minPrice, maxPrice } = req.query;
    const listings = await MarketplaceService.getListings({
      district,
      tehsil,
      search,
      minPrice: minPrice ? parseInt(minPrice) : 0,
      maxPrice: maxPrice ? parseInt(maxPrice) : Infinity,
    });
    return res.status(200).json({
      success: true,
      total: listings.length,
      listings,
    });
  } catch (err) {
    console.error("Error fetching marketplace listings:", err);
    return res.status(500).json({
      success: false,
      message: "भूमि बिक्री सूची प्राप्त करने में त्रुटि",
      error: err.message,
    });
  }
});

/**
 * POST /api/marketplace/list-for-sale - List land for sale
 */
router.post("/list-for-sale", async (req, res) => {
  try {
    const newListing = await MarketplaceService.listLandForSale(req.body);
    return res.status(201).json({
      success: true,
      message: "खेत बिक्री हेतु सफलतापूर्वक सूचीबद्ध किया गया।",
      listing: newListing,
    });
  } catch (err) {
    console.error("Error listing land for sale:", err);
    return res.status(400).json({
      success: false,
      message: err.message || "खेत बिक्री हेतु जोड़ने में त्रुटि।",
    });
  }
});

/**
 * POST /api/marketplace/complete-purchase - Buy and transfer title atomically
 */
router.post("/complete-purchase", async (req, res) => {
  try {
    const { listingId, buyerName, buyerFather, buyerPhone, salePrice, paymentMode } = req.body;
    if (!listingId || !buyerName) {
      return res.status(400).json({
        success: false,
        message: "विलेख संख्या (listingId) और क्रेता का नाम अनिवार्य हैं।",
      });
    }

    const purchaseResult = await MarketplaceService.completePurchase({
      listingId,
      buyerName,
      buyerFather,
      buyerPhone,
      salePrice,
      paymentMode,
    });

    return res.status(200).json(purchaseResult);
  } catch (err) {
    console.error("Error completing purchase:", err);
    return res.status(400).json({
      success: false,
      message: err.message || "भूमि बैनामा क्रय प्रक्रिया में त्रुटि।",
    });
  }
});

/**
 * GET /api/marketplace/khasra-status - Check if a specific khasra is listed for sale
 */
router.get("/khasra-status", (req, res) => {
  const { khasra, village } = req.query;
  const listing = MarketplaceService.getListingByKhasra(khasra, village);
  return res.status(200).json({
    success: true,
    isForSale: Boolean(listing),
    listing: listing || null,
  });
});

export default router;
