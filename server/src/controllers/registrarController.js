import { upDataPipeline } from "../services/upDataPipeline.js";
import { cadastreAiTrainer } from "../services/cadastreAiTrainer.js";
import { khatauniPdfParser } from "../services/khatauniPdfParser.js";

// Active Escrows mock memory store
let activeEscrowList = [
  {
    escrowId: "ESC-2024-8841",
    landId: "104",
    khasraNumber: "104",
    village: "Mauza Naini",
    buyerName: "डॉ. आलोक कुमार (Dr. Alok Kumar)",
    buyerWallet: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    sellerName: "रामेश्वर शर्मा (Rameshwar Sharma)",
    sellerWallet: "0x94B73E12D3F5C24A0991823aA1175628bC38431E",
    amountEth: "1.50 ETH",
    amountInr: 4500000,
    earnestDeposit: "₹4,50,000 (10% Earnest Money Locked)",
    status: "AWAITING_REGISTRAR_SIGNOFF",
    createdAt: "2024-10-14T10:30:00Z",
    objectionPeriodDaysLeft: 5,
  },
  {
    escrowId: "ESC-2024-8842",
    landId: "150/3",
    khasraNumber: "150/3",
    village: "Civil Lines",
    buyerName: "श्रीमती सुनीता मेहरोत्रा (Sunita Mehrotra)",
    buyerWallet: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
    sellerName: "वी. सिंघानिया (V. Singhania)",
    sellerWallet: "0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199",
    amountEth: "6.20 ETH",
    amountInr: 18500000,
    earnestDeposit: "₹18,50,000 (10% Earnest Money Locked)",
    status: "AWAITING_REGISTRAR_SIGNOFF",
    createdAt: "2024-10-16T14:15:00Z",
    objectionPeriodDaysLeft: 6,
  },
];

export const getPendingApplications = async (req, res) => {
  try {
    const all = upDataPipeline.getAllParcels();
    const pending = upDataPipeline.getPendingParcels();

    const enriched = pending.map((parcel) => {
      const aiValuation = cadastreAiTrainer.predictValuation(parcel);
      const aiRisk = cadastreAiTrainer.assessFraudAndAnomalies(parcel, all);
      return {
        ...parcel,
        aiValuation,
        aiRisk,
      };
    });

    const counts = {
      pendingCount: pending.length,
      escrowCount: activeEscrowList.filter((e) => e.status === "AWAITING_REGISTRAR_SIGNOFF").length,
      disputeCount: all.filter((p) => p.isDisputed || p.status === "Disputed").length,
      verifiedCount: all.filter((p) => p.status === "Verified").length,
      totalCount: all.length,
    };

    const aiMetrics = cadastreAiTrainer.getMetrics();

    return res.status(200).json({
      success: true,
      counts,
      aiMetrics,
      applications: enriched,
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

export const approveApplication = async (req, res) => {
  try {
    const { landId, txHash, onChainTokenId, notes } = req.body;
    if (!landId) {
      return res.status(400).json({ success: false, error: "landId is required" });
    }

    const updated = upDataPipeline.updateParcelStatus(landId, "Verified", {
      txHash: txHash || `0x${Date.now().toString(16)}...upcadastre`,
      rwaTokenId: onChainTokenId || landId,
      verifiedAt: new Date().toISOString(),
      registrarNotes: notes || "Deed approved by Sub-Registrar Sadar & Karchhana",
      isDisputed: false,
    });

    if (!updated) {
      return res.status(404).json({ success: false, error: "Parcel not found" });
    }

    return res.status(200).json({
      success: true,
      message: `Parcel #${updated.khasraNumber} Approved and Title Deed RWA Token minted on-chain.`,
      parcel: updated,
      aiMetrics: cadastreAiTrainer.getMetrics(),
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

export const rejectApplication = async (req, res) => {
  try {
    const { landId, rejectionReason } = req.body;
    if (!landId) {
      return res.status(400).json({ success: false, error: "landId is required" });
    }

    const updated = upDataPipeline.updateParcelStatus(landId, "Rejected", {
      rejectionReason: rejectionReason || "Cadastral boundary variance or encumbrance discrepancy",
      rejectedAt: new Date().toISOString(),
    });

    if (!updated) {
      return res.status(404).json({ success: false, error: "Parcel not found" });
    }

    return res.status(200).json({
      success: true,
      message: `Parcel #${updated.khasraNumber} query raised / rejected.`,
      parcel: updated,
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

export const getEscrowDeals = async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      escrows: activeEscrowList,
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

export const createEscrowDeal = async (req, res) => {
  try {
    const { landId, buyerName, buyerWallet, earnestPercent = 10, txHash } = req.body;
    if (!landId) {
      return res.status(400).json({ success: false, error: "landId is required" });
    }

    const parcel = upDataPipeline.getParcelById(landId);
    if (!parcel) {
      return res.status(404).json({ success: false, error: `Parcel #${landId} not found` });
    }

    const totalValuation = parcel.marketPrice || 4500000;
    const earnestInr = Math.round(totalValuation * (earnestPercent / 100));
    const totalEth = parseFloat(parcel.priceEth) || 1.5;
    const earnestEth = (totalEth * (earnestPercent / 100)).toFixed(3);
    const escrowId = `ESC-2024-${Math.floor(1000 + Math.random() * 9000)}`;

    const newDeal = {
      escrowId,
      landId: parcel.landId ? parcel.landId.toString() : landId.toString(),
      khasraNumber: parcel.khasraNumber,
      village: parcel.village || "Mauza Naini",
      buyerName: buyerName || "Verified Citizen Buyer",
      buyerWallet: buyerWallet || "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
      sellerName: parcel.ownerNameEn || parcel.ownerName || "Rameshwar Sharma",
      sellerWallet: parcel.ownerWallet || "0x94B73E12D3F5C24A0991823aA1175628bC38431E",
      amountEth: `${totalEth.toFixed(2)} ETH`,
      amountInr: totalValuation,
      earnestDeposit: `₹${earnestInr.toLocaleString("en-IN")} (${earnestPercent}% Earnest Money Locked)`,
      earnestAmountInr: earnestInr,
      earnestEth: `${earnestEth} ETH`,
      txHash: txHash || `0x${Math.random().toString(16).slice(2, 10)}...deposit`,
      status: "AWAITING_REGISTRAR_SIGNOFF",
      createdAt: new Date().toISOString(),
      objectionPeriodDaysLeft: 7,
    };

    activeEscrowList.unshift(newDeal);

    return res.status(201).json({
      success: true,
      message: `10% Earnest Money (${newDeal.earnestDeposit}) successfully deposited into audited Smart Contract Escrow!`,
      deal: newDeal,
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

export const releaseEscrowDeal = async (req, res) => {
  try {
    const { escrowId, txHash } = req.body;
    const deal = activeEscrowList.find((e) => e.escrowId === escrowId);
    if (!deal) {
      return res.status(404).json({ success: false, error: "Escrow deal not found" });
    }

    deal.status = "SETTLED_OWNERSHIP_TRANSFERRED";
    deal.settledAt = new Date().toISOString();
    deal.releaseTxHash = txHash || `0x${Math.random().toString(16).slice(2, 10)}...escrowrelease`;

    // Transfer ownership in cadastre store
    upDataPipeline.updateParcelStatus(deal.landId, "Verified", {
      ownerName: deal.buyerName,
      ownerWallet: deal.buyerWallet,
      isForSale: false,
    });

    return res.status(200).json({
      success: true,
      message: `Escrow ${escrowId} released. Ownership deed transferred to ${deal.buyerName} on-chain.`,
      deal,
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

export const toggleDisputeFreeze = async (req, res) => {
  try {
    const { landId, isDisputed, reason } = req.body;
    if (!landId) {
      return res.status(400).json({ success: false, error: "landId is required" });
    }

    const updated = upDataPipeline.updateParcelStatus(landId, isDisputed ? "Disputed" : "Verified", {
      isDisputed: Boolean(isDisputed),
      litigationStatus: isDisputed ? (reason || "Court Injunction Active") : "Zero Disputes",
      litigationDetail: isDisputed ? reason : "High Court Injunction Lifted",
    });

    if (!updated) {
      return res.status(404).json({ success: false, error: "Parcel not found" });
    }

    return res.status(200).json({
      success: true,
      message: `Parcel #${updated.khasraNumber} dispute freeze ${isDisputed ? "ACTIVATED" : "LIFTED"}.`,
      parcel: updated,
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

export const importData = async (req, res) => {
  try {
    let content = "";
    let filename = "upload.json";

    // Handle PDF upload if sent to import-data
    if (req.file) {
      filename = req.file.originalname;
      if (filename.toLowerCase().endsWith(".pdf") || req.file.mimetype === "application/pdf") {
        const parseResult = await khatauniPdfParser.parseKhatauni(req.file.buffer);
        return res.status(200).json({
          success: true,
          type: "PDF_KHATAUNI",
          message: `Successfully extracted ${parseResult.totalParcelsExtracted} UP Bhulekh 12-Column parcels from ${filename}`,
          ...parseResult,
        });
      }
      content = req.file.buffer.toString("utf8");
    } else if (req.body && req.body.fileContent) {
      filename = req.body.filename || "payload.json";
      if (filename.toLowerCase().endsWith(".pdf") || req.body.fileContent.startsWith("data:application/pdf")) {
        const parseResult = await khatauniPdfParser.parseKhatauni(req.body.fileContent);
        return res.status(200).json({
          success: true,
          type: "PDF_KHATAUNI",
          message: `Successfully extracted ${parseResult.totalParcelsExtracted} UP Bhulekh 12-Column parcels from ${filename}`,
          ...parseResult,
        });
      }
      content = req.body.fileContent;
    } else if (typeof req.body === "object" && Object.keys(req.body).length > 0) {
      content = JSON.stringify(req.body);
    } else {
      return res.status(400).json({
        success: false,
        error: "No file or data content provided. Send file multipart or JSON { fileContent, filename }",
      });
    }

    const result = upDataPipeline.importUniversalData(content, filename);
    return res.status(200).json(result);
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

export const uploadKhatauniPdf = async (req, res) => {
  try {
    let pdfBuffer;
    let filename = "scanned_khatauni.pdf";

    if (req.file) {
      pdfBuffer = req.file.buffer;
      filename = req.file.originalname;
    } else if (req.body && req.body.fileContent) {
      pdfBuffer = req.body.fileContent;
      filename = req.body.filename || filename;
    } else {
      return res.status(400).json({
        success: false,
        error: "No PDF file provided. Upload multipart 'pdfFile' or pass base64 'fileContent'",
      });
    }

    const parseResult = await khatauniPdfParser.parseKhatauni(pdfBuffer);
    return res.status(200).json({
      success: true,
      message: `Parsed ${parseResult.totalParcelsExtracted} parcel(s) from UP Bhulekh Khatauni (${filename})`,
      ...parseResult,
      counts: {
        pendingCount: upDataPipeline.getPendingParcels().length,
        totalCount: upDataPipeline.getAllParcels().length,
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

export const fetchLiveUPOverpass = async (req, res) => {
  try {
    const { lat = 25.4218, lng = 81.8654, radius = 600 } = req.body;
    const result = await upDataPipeline.fetchLiveOverpassParcels(lat, lng, radius);
    return res.status(200).json(result);
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

export const getAiMetrics = async (req, res) => {
  try {
    const metrics = cadastreAiTrainer.getMetrics();
    return res.status(200).json({ success: true, metrics });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

export const retrainAiModel = async (req, res) => {
  try {
    const all = upDataPipeline.getAllParcels();
    const metrics = cadastreAiTrainer.trainModel(all);
    return res.status(200).json({
      success: true,
      message: `AI Model successfully re-trained on ${all.length} live UP parcels.`,
      metrics,
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};
