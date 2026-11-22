import mongoose from "mongoose";
import Property from "../models/Property.js";
import Transaction from "../models/Transaction.js";
import { memoryProperties } from "./propertyController.js";
import fs from "fs";

let memoryTransactions = [
  {
    _id: "mem_tx_1",
    onChainId: 1,
    buyerWallet: "0x90f79bf6eb2c4f870365e785982e1f101e93b906",
    sellerWallet: "0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc",
    amount: "1.5",
    escrowStatus: "INITIATED",
    txHash: "0x4b789134a8e8f81024cd9a1e0b5ef8826a793a3df5cb4c74900aef12d098ab11",
    timestamp: new Date().toISOString(),
  },
];

/**
 * Government Registrar & Super Admin Controller
 */

// 1. Bulk Ingest GeoJSON Cadastral Data
export const importGeoJSON = async (req, res) => {
  try {
    let geoJsonData;

    if (req.file) {
      const raw = fs.readFileSync(req.file.path, "utf8");
      geoJsonData = JSON.parse(raw);
    } else if (req.body && req.body.features) {
      geoJsonData = req.body;
    } else if (req.body && req.body.type === "FeatureCollection") {
      geoJsonData = req.body;
    } else if (Array.isArray(req.body)) {
      geoJsonData = { type: "FeatureCollection", features: req.body };
    } else {
      return res.status(400).json({
        success: false,
        message: "Invalid GeoJSON data. Please upload a valid .geojson or .json FeatureCollection.",
      });
    }

    const features = geoJsonData.features || [];
    if (!features.length) {
      return res.status(400).json({ success: false, message: "GeoJSON contains 0 features" });
    }

    const imported = [];
    const errors = [];
    let nextOnChainId = 20;

    for (let i = 0; i < features.length; i++) {
      const feature = features[i];
      const props = feature.properties || {};
      const geometry = feature.geometry;

      if (!geometry || geometry.type !== "Polygon") {
        errors.push(`Feature #${i + 1} skipped: Geometry must be a valid GeoJSON Polygon`);
        continue;
      }

      if (geometry.coordinates && geometry.coordinates[0]?.length >= 3) {
        const ring = geometry.coordinates[0];
        const first = ring[0];
        const last = ring[ring.length - 1];
        if (first[0] !== last[0] || first[1] !== last[1]) {
          ring.push([first[0], first[1]]);
        }
      }

      const khasraNumber = props.khasraNumber || props.khasra_no || props.gata_no || props.id || `Import-${Date.now()}-${i}`;
      const village = props.village || props.gram || "Civil Lines";
      const tehsil = props.tehsil || "Sadar";
      const district = props.district || "Prayagraj";
      const ownerName = props.ownerName || props.owner || "Registered Landholder";
      const ownerWallet = (props.ownerWallet || props.wallet || "0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc").toLowerCase();
      const area = props.area || 2000;
      const areaHectares = props.areaHectares || parseFloat((area / 10000).toFixed(3));
      const price = (props.price || "1.5").toString();
      const marketPrice = props.marketPrice || 7500000;
      const status = props.status || "Verified";
      const isForSale = props.isForSale !== undefined ? props.isForSale : true;
      const loanFlag = props.loanFlag !== undefined ? props.loanFlag : false;
      const disputeStatus = props.disputeStatus !== undefined ? props.disputeStatus : false;
      const disputeRemarks = props.disputeRemarks || (disputeStatus ? "Disputed in Revenue Court" : "Clear Title Record");

      const parcelData = {
        onChainId: nextOnChainId++,
        khasraNumber,
        khataNumber: props.khataNumber || props.khata_no || "00350",
        village,
        tehsil,
        district,
        state: "Uttar Pradesh",
        ownerName,
        ownerWallet,
        area,
        areaHectares,
        price,
        marketPrice,
        status,
        isForSale,
        loanFlag,
        loanDetails: props.loanDetails || { bankName: "None", loanAmount: 0 },
        disputeStatus,
        disputeRemarks,
        ipfsCid: props.ipfsCid || "bafybeic73x7v57qln4x535n23l65p3z3i7dvh6x3a",
        documentUrl: props.documentUrl || "https://ipfs.io/ipfs/bafybeic73x7v57qln4x535n23l65p3z3i7dvh6x3a/deed.pdf",
        ownershipHistory: props.ownershipHistory || [
          {
            ownerName,
            ownerWallet,
            fromDate: "2018-05-10",
            toDate: "Present",
            txHash: "Imported from Cadastral GIS Record",
          },
        ],
        geometry,
      };

      if (mongoose.connection.readyState === 1) {
        const updated = await Property.findOneAndUpdate(
          { khasraNumber, village },
          parcelData,
          { upsert: true, new: true }
        );
        imported.push(updated);
      } else {
        const existingIdx = memoryProperties.findIndex((p) => p.khasraNumber === khasraNumber);
        if (existingIdx >= 0) {
          memoryProperties[existingIdx] = { ...memoryProperties[existingIdx], ...parcelData };
          imported.push(memoryProperties[existingIdx]);
        } else {
          const item = { _id: `mem_import_${Date.now()}_${i}`, ...parcelData };
          memoryProperties.push(item);
          imported.push(item);
        }
      }
    }

    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.json({
      success: true,
      message: `Successfully processed GeoJSON: ${imported.length} land parcels imported or updated.`,
      count: imported.length,
      errors: errors.length ? errors : undefined,
      parcels: imported,
    });
  } catch (err) {
    console.error("GeoJSON import error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// 2. Pending Land Verifications
export const getPendingVerifications = async (req, res) => {
  try {
    let pending;
    if (mongoose.connection.readyState === 1) {
      pending = await Property.find({ status: "Pending" }).sort({ createdAt: -1 });
    } else {
      pending = memoryProperties.filter((p) => p.status === "Pending");
    }
    res.json({ success: true, count: pending.length, pending });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// 3. Registrar Verify / Reject Action
export const verifyProperty = async (req, res) => {
  try {
    const { id } = req.params;
    const { approved, remarks } = req.body;

    let property;
    if (mongoose.connection.readyState === 1) {
      property = await Property.findById(id);
      if (property) {
        property.status = approved ? "Verified" : "Rejected";
        if (remarks) property.disputeRemarks = remarks;
        await property.save();
      }
    } else {
      property = memoryProperties.find((p) => p._id === id);
      if (property) {
        property.status = approved ? "Verified" : "Rejected";
        if (remarks) property.disputeRemarks = remarks;
      }
    }

    if (!property) {
      return res.status(404).json({ success: false, message: "Property parcel not found" });
    }

    res.json({
      success: true,
      message: `Property ${property.khasraNumber} has been ${property.status}`,
      property,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// 4. Freeze / Lift Dispute & Loan Alerts
export const toggleDispute = async (req, res) => {
  try {
    const { id } = req.params;
    const { disputeStatus, disputeRemarks, loanFlag, bankName, loanAmount } = req.body;

    let property;
    if (mongoose.connection.readyState === 1) {
      property = await Property.findById(id);
    } else {
      property = memoryProperties.find((p) => p._id === id);
    }

    if (!property) {
      return res.status(404).json({ success: false, message: "Property parcel not found" });
    }

    const newStatus = disputeStatus !== undefined ? disputeStatus : !property.disputeStatus;
    property.disputeStatus = newStatus;
    if (newStatus) {
      property.status = "Disputed";
      property.isForSale = false;
      property.disputeRemarks = disputeRemarks || "Court Injunction / Freeze Order in effect.";
    } else {
      property.status = "Verified";
      property.disputeRemarks = "Dispute resolved. Clean title restored.";
    }

    if (loanFlag !== undefined) {
      property.loanFlag = loanFlag;
      if (loanFlag) {
        property.loanDetails = {
          bankName: bankName || "Nationalized Bank",
          loanAmount: loanAmount || 2500000,
          mortgageDate: new Date().toISOString().split("T")[0],
        };
      }
    }

    if (mongoose.connection.readyState === 1) {
      await property.save();
    }

    res.json({
      success: true,
      message: `Dispute status updated: ${newStatus ? "FROZEN / DISPUTED" : "CLEARED / ACTIVE"}`,
      property,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// 5. Escrow Deals list
export const getEscrowDeals = async (req, res) => {
  try {
    let deals;
    if (mongoose.connection.readyState === 1) {
      deals = await Transaction.find().populate("propertyId").sort({ createdAt: -1 });
    } else {
      deals = memoryTransactions;
    }
    res.json({ success: true, count: deals.length, deals });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
