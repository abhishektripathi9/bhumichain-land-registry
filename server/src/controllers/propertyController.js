import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import Property from "../models/Property.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// In-Memory store fallback initialized from seedData.json
const seedDataPath = path.join(__dirname, "../seeds/seedData.json");
let memoryProperties = [];
try {
  if (fs.existsSync(seedDataPath)) {
    const raw = fs.readFileSync(seedDataPath, "utf8");
    memoryProperties = JSON.parse(raw).map((p, idx) => ({
      _id: `mem_parcel_${idx + 1}`,
      ...p,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));
  }
} catch (e) {
  console.warn("Could not load memory seed data:", e);
}

// Ray-casting point-in-polygon math
function pointInPolygon(point, vs) {
  const x = point[0], y = point[1];
  let inside = false;
  for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
    const xi = vs[i][0], yi = vs[i][1];
    const xj = vs[j][0], yj = vs[j][1];
    const intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

// Distance approximation for proximity
function distance(pt1, pt2) {
  const dx = pt1[0] - pt2[0];
  const dy = pt1[1] - pt2[1];
  return Math.sqrt(dx * dx + dy * dy);
}

export { memoryProperties };

/**
 * Layer 2: Geospatial & Verification Engine
 */

// 1. GPS Point-in-Polygon & Proximity Detection
export const detectPropertyByGPS = async (req, res) => {
  try {
    const lat = parseFloat(req.query.lat);
    const lng = parseFloat(req.query.lng);

    if (isNaN(lat) || isNaN(lng)) {
      return res.status(400).json({
        success: false,
        message: "Valid lat and lng query parameters are required",
      });
    }

    const queryPoint = {
      type: "Point",
      coordinates: [lng, lat],
    };

    // Check if live MongoDB connection is active
    if (mongoose.connection.readyState === 1) {
      // A) Strict Point-in-Polygon via $geoIntersects
      let parcel = await Property.findOne({
        geometry: {
          $geoIntersects: {
            $geometry: queryPoint,
          },
        },
      });

      if (parcel) {
        return res.json({
          success: true,
          detectionType: "EXACT_PARCEL_MATCH",
          matchAccuracy: "100% (Inside Boundary)",
          parcel,
        });
      }

      // B) Proximity fallback via $near (within 1000 meters)
      const nearby = await Property.find({
        geometry: {
          $near: {
            $geometry: queryPoint,
            $maxDistance: 1000,
          },
        },
      }).limit(3);

      if (nearby && nearby.length > 0) {
        return res.json({
          success: true,
          detectionType: "PROXIMITY_MATCH",
          matchAccuracy: "Near Parcel Boundary (Within 1000m)",
          parcel: nearby[0],
          nearbyParcels: nearby,
        });
      }
    } else {
      // In-Memory Math Ray-Casting Fallback
      for (const p of memoryProperties) {
        const ring = p.geometry?.coordinates?.[0];
        if (ring && pointInPolygon([lng, lat], ring)) {
          return res.json({
            success: true,
            detectionType: "EXACT_PARCEL_MATCH",
            matchAccuracy: "100% (Inside Boundary)",
            parcel: p,
          });
        }
      }

      // Proximity search in memory
      let closest = null;
      let minDistance = Infinity;
      for (const p of memoryProperties) {
        const ring = p.geometry?.coordinates?.[0];
        if (ring && ring.length > 0) {
          const centroid = ring[0];
          const d = distance([lng, lat], centroid);
          if (d < minDistance) {
            minDistance = d;
            closest = p;
          }
        }
      }

      if (closest && minDistance < 0.05) {
        // ~5km approx
        return res.json({
          success: true,
          detectionType: "PROXIMITY_MATCH",
          matchAccuracy: "Near Parcel Boundary",
          parcel: closest,
        });
      }
    }

    return res.status(404).json({
      success: false,
      message: "No registered land parcel detected at these GPS coordinates. You can plot and register a new land boundary.",
      coordinates: { lat, lng },
    });
  } catch (err) {
    console.error("GPS Detection error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// 2. Fetch all properties with optional filters
export const getAllProperties = async (req, res) => {
  try {
    const { village, status, isForSale, ownerWallet, search } = req.query;
    let properties = [];

    if (mongoose.connection.readyState === 1) {
      const filter = {};
      if (village) filter.village = new RegExp(village, "i");
      if (status) filter.status = status;
      if (isForSale !== undefined) filter.isForSale = isForSale === "true";
      if (ownerWallet) filter.ownerWallet = ownerWallet.toLowerCase();

      if (search) {
        filter.$or = [
          { khasraNumber: new RegExp(search, "i") },
          { khataNumber: new RegExp(search, "i") },
          { village: new RegExp(search, "i") },
          { ownerName: new RegExp(search, "i") },
          { district: new RegExp(search, "i") },
        ];
      }

      properties = await Property.find(filter).sort({ createdAt: -1 });
    } else {
      // In-Memory filtering
      properties = memoryProperties.filter((p) => {
        if (village && !p.village.toLowerCase().includes(village.toLowerCase())) return false;
        if (status && p.status !== status) return false;
        if (isForSale !== undefined && p.isForSale !== (isForSale === "true")) return false;
        if (ownerWallet && p.ownerWallet.toLowerCase() !== ownerWallet.toLowerCase()) return false;
        if (search) {
          const s = search.toLowerCase();
          const match =
            p.khasraNumber.toLowerCase().includes(s) ||
            p.village.toLowerCase().includes(s) ||
            p.ownerName.toLowerCase().includes(s);
          if (!match) return false;
        }
        return true;
      });
    }

    // Also return as GeoJSON FeatureCollection for easy GIS client rendering
    const geoJsonFeatureCollection = {
      type: "FeatureCollection",
      features: properties.map((p) => ({
        type: "Feature",
        id: p._id,
        properties: {
          id: p._id,
          onChainId: p.onChainId,
          khasraNumber: p.khasraNumber,
          khataNumber: p.khataNumber,
          village: p.village,
          tehsil: p.tehsil,
          district: p.district,
          ownerName: p.ownerName,
          ownerWallet: p.ownerWallet,
          area: p.area,
          areaHectares: p.areaHectares,
          price: p.price,
          marketPrice: p.marketPrice,
          status: p.status,
          isForSale: p.isForSale,
          loanFlag: p.loanFlag,
          loanDetails: p.loanDetails,
          disputeStatus: p.disputeStatus,
          disputeRemarks: p.disputeRemarks,
          ipfsCid: p.ipfsCid,
          documentUrl: p.documentUrl,
          ownershipHistory: p.ownershipHistory,
        },
        geometry: p.geometry,
      })),
    };

    res.json({
      success: true,
      count: properties.length,
      properties,
      geoJson: geoJsonFeatureCollection,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// 3. Get single property by ID or onChainId
export const getPropertyById = async (req, res) => {
  try {
    const { id } = req.params;
    let parcel;

    if (mongoose.connection.readyState === 1) {
      if (id.match(/^[0-9a-fA-F]{24}$/)) {
        parcel = await Property.findById(id);
      } else if (!isNaN(parseInt(id))) {
        parcel = await Property.findOne({ onChainId: parseInt(id) });
      }
    } else {
      parcel = memoryProperties.find((p) => p._id === id || p.onChainId === parseInt(id));
    }

    if (!parcel) {
      return res.status(404).json({ success: false, message: "Property parcel not found" });
    }

    res.json({ success: true, parcel });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// 4. Register new parcel (Citizen / Surveyor)
export const registerProperty = async (req, res) => {
  try {
    const {
      onChainId,
      khasraNumber,
      khataNumber,
      village,
      tehsil,
      district,
      ownerName,
      ownerWallet,
      area,
      areaHectares,
      price,
      marketPrice,
      ipfsCid,
      documentUrl,
      geometry,
    } = req.body;

    if (!khasraNumber || !geometry || !ownerWallet) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: khasraNumber, geometry, and ownerWallet are required",
      });
    }

    // Ensure polygon is closed
    const coordinates = geometry.coordinates;
    if (coordinates && coordinates[0] && coordinates[0].length >= 3) {
      const ring = coordinates[0];
      const first = ring[0];
      const last = ring[ring.length - 1];
      if (first[0] !== last[0] || first[1] !== last[1]) {
        ring.push([first[0], first[1]]);
      }
    }

    const parcelData = {
      onChainId: onChainId || null,
      khasraNumber,
      khataNumber: khataNumber || "Pending",
      village: village || "Prayagraj",
      tehsil: tehsil || "Sadar",
      district: district || "Prayagraj",
      state: "Uttar Pradesh",
      ownerName: ownerName || "Registered Citizen",
      ownerWallet: ownerWallet.toLowerCase(),
      area: area || 1500,
      areaHectares: areaHectares || (area ? parseFloat((area / 10000).toFixed(3)) : 0.15),
      price: price || "1.0",
      marketPrice: marketPrice || 5000000,
      status: "Pending",
      isForSale: false,
      loanFlag: false,
      disputeStatus: false,
      disputeRemarks: "New application pending registrar verification.",
      ipfsCid: ipfsCid || "",
      documentUrl: documentUrl || "",
      ownershipHistory: [
        {
          ownerName: ownerName || "Registered Citizen",
          ownerWallet: ownerWallet.toLowerCase(),
          fromDate: new Date().toISOString().split("T")[0],
          toDate: "Present",
          txHash: "Off-Chain / Initial Submission",
        },
      ],
      geometry: {
        type: "Polygon",
        coordinates: coordinates,
      },
    };

    let newProperty;
    if (mongoose.connection.readyState === 1) {
      newProperty = await Property.create(parcelData);
    } else {
      newProperty = {
        _id: `mem_parcel_${Date.now()}`,
        ...parcelData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      memoryProperties.unshift(newProperty);
    }

    res.status(201).json({
      success: true,
      message: "Land Parcel registered successfully and queued for registrar verification",
      property: newProperty,
    });
  } catch (err) {
    console.error("Register property error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// 5. Update Listing status
export const toggleForSale = async (req, res) => {
  try {
    const { id } = req.params;
    const { isForSale, price } = req.body;

    let property;
    if (mongoose.connection.readyState === 1) {
      property = await Property.findById(id);
    } else {
      property = memoryProperties.find((p) => p._id === id);
    }

    if (!property) {
      return res.status(404).json({ success: false, message: "Property not found" });
    }

    if (property.disputeStatus) {
      return res.status(400).json({ success: false, message: "Cannot list disputed or mortgaged land" });
    }

    property.isForSale = isForSale !== undefined ? isForSale : !property.isForSale;
    if (price) property.price = price;

    if (mongoose.connection.readyState === 1) {
      await property.save();
    }

    res.json({
      success: true,
      message: `Property sale status updated to ${property.isForSale}`,
      property,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// 6. Update Owner Privacy & Viewing Permissions ("Kisko kisko dekhna hai")
export const updatePropertyPrivacy = async (req, res) => {
  try {
    const { id } = req.params;
    const { visibilityMode, allowedViewers } = req.body;
    const wallet = req.headers["x-wallet-address"]?.toLowerCase();

    let property;
    if (mongoose.connection.readyState === 1) {
      property = await Property.findById(id);
    } else {
      property = memoryProperties.find((p) => p._id === id || p.onChainId == id);
    }

    if (!property) {
      return res.status(404).json({ success: false, message: "Property not found" });
    }

    if (
      wallet &&
      property.ownerWallet?.toLowerCase() !== wallet &&
      !["0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266", "0x70997970c51812dc3a010c7d01b50e0d17dc79c8"].includes(wallet)
    ) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized: Only the registered proprietor can set viewing permissions.",
      });
    }

    if (visibilityMode) property.visibilityMode = visibilityMode;
    if (Array.isArray(allowedViewers)) {
      property.allowedViewers = allowedViewers.map((a) => a.toLowerCase().trim());
    }

    if (mongoose.connection.readyState === 1) {
      await property.save();
    }

    res.json({
      success: true,
      message: "Owner privacy & viewing permissions successfully updated",
      property,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
