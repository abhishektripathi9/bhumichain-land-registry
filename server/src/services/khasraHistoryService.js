import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { resolveExactUPPincode } from "./verifiedPincodeService.js";
import { liveGovDataService } from "./liveGovDataService.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// In-Memory store for dynamic Khasra histories & transfer updates
const khasraHistoryStore = new Map();

/**
 * Normalizes input keys for robust lookup
 */
function makeKey(district, tehsil, block, village, khasraNo) {
  const d = (district || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  const v = (village || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  const k = (khasraNo || "").toString().replace(/^#/, "").trim();
  return `${d}_${v}_${k}`;
}

/**
 * Realistic UP Owner Name Generator for historical timeline
 */
const UP_ANCESTRAL_NAMES = [
  { current: "राम प्रकाश यादव", father: "स्व. रामेश्वर यादव", prev1: "रामेश्वर बिहारी यादव", prev2: "स्व. बिहारी लाल यादव", caste: "यादव" },
  { current: "राघवेंद्र प्रताप सिंह", father: "स्व. ठाकुर सूर्यभान सिंह", prev1: "सूर्यभान उदय सिंह", prev2: "स्व. महाराज सिंह", caste: "सिंह" },
  { current: "शिवनारायण त्रिपाठी", father: "स्व. पं. उमाशंकर त्रिपाठी", prev1: "उमाशंकर केदारनाथ त्रिपाठी", prev2: "स्व. केदारनाथ त्रिपाठी", caste: "त्रिपाठी" },
  { current: "महेंद्र कुमार वर्मा", father: "स्व. बाबूलाल वर्मा", prev1: "बाबूलाल रामस्वरूप वर्मा", prev2: "स्व. रामस्वरूप वर्मा", caste: "वर्मा" },
  { current: "धर्मराज पटेल", father: "स्व. गंगाप्रसाद पटेल", prev1: "गंगाप्रसाद रामआसरे पटेल", prev2: "स्व. रामआसरे पटेल", caste: "पटेल" },
  { current: "सुनील कुमार गुप्ता", father: "स्व. बनवारी लाल गुप्ता", prev1: "बनवारी लाल राधे गुप्ता", prev2: "स्व. राधे श्याम गुप्ता", caste: "गुप्ता" },
  { current: "अशोक कुमार कुशवाहा", father: "स्व. रामचरन कुशवाहा", prev1: "रामचरन सुंदर कुशवाहा", prev2: "स्व. सुंदर लाल कुशवाहा", caste: "कुशवाहा" }
];

export class KhasraHistoryService {
  /**
   * Resolves complete Ownership History ("पहले किसकी थी → आज किसकी है")
   */
  static async resolveKhasraHistory({ district = "Chitrakoot", tehsil = "Rajapur", block = "Ramnagar", village = "Ramnagar", khasraNo = "104", lat = "", lng = "" }) {
    const cleanKhasra = (khasraNo || "104").toString().replace(/^#/, "").trim();
    const cleanVillage = (village || "").replace(/^(Mauza|Kasba|मौजा|कस्बा)\s+/i, "").trim() || "Ramnagar";
    const cleanDistrict = (district || "Chitrakoot").trim();
    const cleanTehsil = (tehsil || "Rajapur").trim();
    const cleanBlock = (block || "Ramnagar").trim();

    const cacheKey = makeKey(cleanDistrict, cleanTehsil, cleanBlock, cleanVillage, cleanKhasra);

    // If dynamically modified in memory (e.g. after a purchase/transfer), return updated record
    if (khasraHistoryStore.has(cacheKey)) {
      return khasraHistoryStore.get(cacheKey);
    }

    // Resolve accurate 6-digit Pincode via 3-Layer Verified Engine
    let centerLat = parseFloat(lat);
    let centerLng = parseFloat(lng);
    if (isNaN(centerLat) || isNaN(centerLng)) {
      const centroid = liveGovDataService.getTehsilCentroid(cleanDistrict, cleanTehsil);
      centerLat = centroid[0];
      centerLng = centroid[1];
    }

    const pinInfo = await resolveExactUPPincode({
      district: cleanDistrict,
      tehsil: cleanTehsil,
      block: cleanBlock,
      village: cleanVillage,
      lat: centerLat,
      lng: centerLng,
    });

    const realPincode = pinInfo?.pincode || (cleanDistrict.toLowerCase().includes("chitra") ? "210207" : "210001");
    const kNum = parseInt(cleanKhasra) || 104;

    // Pick realistic ancestral lineage based on Khasra Number
    const profile = UP_ANCESTRAL_NAMES[kNum % UP_ANCESTRAL_NAMES.length];
    const khataNum = String(100 + (kNum % 899)).padStart(5, "0");

    // Realistic plot dimensions & Area
    const baseNorth = 48 + ((kNum * 7) % 35);
    const baseSouth = baseNorth + (((kNum * 3) % 4) - 2);
    const baseEast = 50 + ((kNum * 11) % 40);
    const baseWest = baseEast + (((kNum * 5) % 4) - 2);

    const avgNS = (baseNorth + baseSouth) / 2;
    const avgEW = (baseEast + baseWest) / 2;
    const areaSqFt = Math.round(avgNS * avgEW) || 2400;
    const pakkaBigha = parseFloat((areaSqFt / 27225).toFixed(3));
    const biswa = parseFloat((areaSqFt / 1361.25).toFixed(2));
    const hectare = parseFloat((areaSqFt / 107639.1).toFixed(4));

    // Unique Certificate ID
    const distPrefix = cleanDistrict.slice(0, 4).toUpperCase();
    const certId = `UP-REV-2026-${distPrefix}-${cleanKhasra}`;

    // Chronological Past Owners Timeline (1995 to 2026)
    const pastOwners = [
      {
        ownerName: profile.prev2,
        relation: "पूर्व पुश्तैनी खातेदार (Ancestral Patriarch)",
        tenurePeriod: "1995 - 2008 (13 वर्ष)",
        startFasli: "1402 फसली",
        endFasli: "1415 फसली",
        transferMode: "वरासत / पैतृक अधिकार (Ancestral Inheritance)",
        orderNumber: `तहसील ${cleanTehsil} प.क. 11 आदेश सं. 104/1995`,
        orderDate: "12-07-1995",
        status: "पूर्व मालिक (Transferred on Succession)",
        remarks: "स्वच्छ विरासत नामांतरण, समस्त राजस्व देय चुकता।"
      },
      {
        ownerName: profile.prev1,
        relation: `आत्मज ${profile.prev2}`,
        tenurePeriod: "2008 - 2018 (10 वर्ष)",
        startFasli: "1416 फसली",
        endFasli: "1425 फसली",
        transferMode: "वरासत धारा 33 (Succession by Will/Inheritance)",
        orderNumber: `तहसीलदार ${cleanTehsil} वाद सं. ${cleanKhasra}/2008`,
        orderDate: "24-10-2008",
        status: "पूर्व मालिक (Transferred by Sale Deed)",
        remarks: "धारा 34 अंतर्गत नामांतरण आदेश स्वीकृत व खतौनी में दर्ज।"
      }
    ];

    // Current Owner (2018 - Present)
    const currentOwner = {
      ownerName: profile.current,
      fatherName: profile.father,
      khataNumber: khataNum,
      khasraNumber: cleanKhasra,
      village: cleanVillage,
      block: cleanBlock,
      tehsil: cleanTehsil,
      district: cleanDistrict,
      pincode: realPincode,
      postOfficeName: pinInfo?.postOfficeName || `${cleanTehsil} डाकघर`,
      tenurePeriod: "2018 - वर्तमान (Present)",
      startFasli: "1426 फसली (वर्तमान 1431-1436 फसली)",
      transferMode: "बैनामा / रजिस्ट्री विलेख (Registered Sale Deed)",
      mutationOrderNumber: `उप-निबंधक कार्यालय ${cleanTehsil} विलेख सं. ${8800 + kNum}/2018 • दाखिल-खारिज आदेश दिनांक 14-11-2018`,
      ownershipShare: "1/1 (100% पूर्ण एकल स्वामित्व)",
      loanStatus: "स्वच्छ एवं ऋण-मुक्त (Zero Bank Lien / भार-रहित)",
      disputeStatus: "स्वच्छ एवं विवाद-मुक्त (Zero Litigation / कोई वाद नहीं)",
      isClearTitle: true,
      hasDispute: false,
      hasLoan: false,
    };

    // Four sides measurements
    const fourSides = {
      north: { feet: baseNorth, meters: parseFloat((baseNorth * 0.3048).toFixed(2)) },
      south: { feet: baseSouth, meters: parseFloat((baseSouth * 0.3048).toFixed(2)) },
      east: { feet: baseEast, meters: parseFloat((baseEast * 0.3048).toFixed(2)) },
      west: { feet: baseWest, meters: parseFloat((baseWest * 0.3048).toFixed(2)) },
    };

    // Financials
    const circleRatePerSqFt = cleanDistrict.toLowerCase().includes("prayag") || cleanDistrict.toLowerCase().includes("luck") ? 1850 : 1250;
    const circleRate = Math.round(areaSqFt * circleRatePerSqFt);
    const marketPrice = Math.round(circleRate * 1.25);
    const pricePerBigha = pakkaBigha > 0 ? Math.round(marketPrice / pakkaBigha) : marketPrice;

    const historyRecord = {
      success: true,
      certificateId: certId,
      khasraNumber: cleanKhasra,
      khataNumber: khataNum,
      village: cleanVillage,
      block: cleanBlock,
      tehsil: cleanTehsil,
      district: cleanDistrict,
      pincode: realPincode,
      postOfficeName: pinInfo?.postOfficeName || `${cleanTehsil} डाकघर`,
      currentOwner,
      pastOwners,
      area: {
        pakkaBigha,
        biswa,
        hectare,
        sqFt: areaSqFt,
        sqMeters: parseFloat((areaSqFt * 0.0929).toFixed(2)),
      },
      fourSides,
      pricing: {
        circleRate,
        marketPrice,
        pricePerBigha,
        upStampDuty7Pct: Math.round(marketPrice * 0.07),
      },
      chauhaddi: {
        north: `गाटा सं. ${kNum - 1} (चक मार्ग 4.0 मीटर)`,
        south: `गाटा सं. ${kNum + 1} (निजी काश्तकार भूमि)`,
        east: `गाटा सं. ${kNum + 2} (पक्का मेड़ सीमांकन)`,
        west: "मुख्य संपर्क मार्ग / सार्वजनिक नाली",
      },
      qrVerificationUrl: `https://bhumichain.up.gov.in/verify/${certId}`,
      isForSale: kNum % 2 === 0, // Even numbered plots available for sale by default
      listedPrice: marketPrice,
      listedPricePerBigha: pricePerBigha,
      lastUpdated: new Date().toISOString(),
    };

    khasraHistoryStore.set(cacheKey, historyRecord);
    return historyRecord;
  }

  /**
   * Records a new transfer/purchase, moving current owner to past owners
   */
  static async recordOwnershipTransfer({ district, tehsil, block, village, khasraNo, newBuyerName, newBuyerFather, newBuyerPhone, salePrice }) {
    const existing = await this.resolveKhasraHistory({ district, tehsil, block, village, khasraNo });
    if (!existing) return null;

    const oldOwner = existing.currentOwner;
    const nowYear = new Date().getFullYear();

    // Move current owner to past owners
    const archivedOwner = {
      ownerName: oldOwner.ownerName,
      relation: oldOwner.fatherName,
      tenurePeriod: `2018 - ${nowYear} (${nowYear - 2018} वर्ष)`,
      startFasli: "1426 फसली",
      endFasli: `${1430 + (nowYear - 2023)} फसली`,
      transferMode: "बैनामा (रजिस्ट्री विलेख द्वारा अंतरित)",
      orderNumber: `उप-निबंधक कार्यालय ${tehsil} विलेख सं. BC-${Date.now().toString().slice(-6)}/${nowYear}`,
      orderDate: new Date().toLocaleDateString("hi-IN"),
      status: "पूर्व विक्रेता (Seller Transferred Title)",
      remarks: `₹${parseInt(salePrice || existing.pricing.marketPrice).toLocaleString("en-IN")} प्रतिफल राशि प्राप्त कर स्वच्छ अंतरण।`
    };

    const updatedPastOwners = [archivedOwner, ...existing.pastOwners];

    const distPrefix = district.slice(0, 4).toUpperCase();
    const newCertId = `UP-REV-${nowYear}-${distPrefix}-${khasraNo}-NEW`;

    const updatedCurrentOwner = {
      ...oldOwner,
      ownerName: newBuyerName || "नया प्रमाणित काश्तकार",
      fatherName: newBuyerFather || "आत्मज",
      phone: newBuyerPhone || "",
      tenurePeriod: `${nowYear} - वर्तमान (Present)`,
      startFasli: `${1431 + (nowYear - 2024)} फसली (नवीनतम संक्राम्य अधिकार)`,
      transferMode: "बैनामा (रजिस्ट्री) / डिजिटल डीड (BhumiChain Verified Deed)",
      mutationOrderNumber: `प.क. 11 आदेश तहसीलदार ${tehsil} दिनांक ${new Date().toLocaleDateString("hi-IN")}`,
      loanStatus: "स्वच्छ एवं ऋण-मुक्त (Zero Bank Lien)",
      disputeStatus: "स्वच्छ एवं विवाद-मुक्त (Zero Litigation)",
      ownershipShare: "1/1 (100% पूर्ण स्वामित्व)",
    };

    const updatedRecord = {
      ...existing,
      certificateId: newCertId,
      currentOwner: updatedCurrentOwner,
      pastOwners: updatedPastOwners,
      isForSale: false, // Purchased, so no longer listed for sale
      qrVerificationUrl: `https://bhumichain.up.gov.in/verify/${newCertId}`,
      lastUpdated: new Date().toISOString(),
    };

    const cacheKey = makeKey(district, tehsil, block, village, khasraNo);
    khasraHistoryStore.set(cacheKey, updatedRecord);
    return updatedRecord;
  }

  /**
   * Verifies by Certificate ID or Gata/Village
   */
  static findByCertificateOrGata(queryStr) {
    if (!queryStr) return null;
    const cleanQ = queryStr.trim().toLowerCase();

    for (const [key, record] of khasraHistoryStore.entries()) {
      if (
        record.certificateId.toLowerCase().includes(cleanQ) ||
        key.includes(cleanQ) ||
        record.khasraNumber === cleanQ
      ) {
        return record;
      }
    }
    return null;
  }
}
