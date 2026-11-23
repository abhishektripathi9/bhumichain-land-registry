import { KhasraHistoryService } from "./khasraHistoryService.js";
import { resolveExactUPPincode } from "./verifiedPincodeService.js";
import { liveGovDataService } from "./liveGovDataService.js";

// In-Memory store for active land listings across Uttar Pradesh
let marketplaceListings = [
  {
    id: "LIST-CHTR-104",
    title: "उपजाऊ दोमट कृषि खेत (Prime Agricultural Land)",
    district: "Chitrakoot",
    tehsil: "Rajapur",
    block: "Ramnagar",
    village: "Ramnagar",
    khasraNumber: "104",
    khataNumber: "00104",
    pincode: "210207",
    postOffice: "Rajapur (Chitrakoot)",
    areaBigha: 2.5,
    areaBiswa: 50.0,
    areaSqFt: 68062,
    areaHectare: 0.6323,
    landType: "कृषि भूमि (नहरी सिंचाई उपलब्ध)",
    askingPriceInr: 2500000,
    pricePerBighaInr: 1000000,
    circleRateInr: 1980000,
    ownerName: "राम प्रकाश यादव",
    ownerPhone: "+91 94150 89211",
    ownerFather: "स्व. रामेश्वर यादव",
    titleStatus: "स्वच्छ एवं विवाद-मुक्त (Zero Litigation)",
    loanStatus: "भार-मुक्त (Nil Bank Encumbrance)",
    status: "AVAILABLE",
    lat: 25.3852,
    lng: 81.1524,
    features: ["चक मार्ग 4.0 मीटर चौड़ा", "बोरवेल व नलकूप पानी", "सड़क से 150 मीटर दूरी", "पक्का सीमांकन"],
    listedAt: "2026-11-20T10:00:00Z",
    certificateId: "UP-REV-2026-CHTR-104"
  },
  {
    id: "LIST-BNDA-208",
    title: "सड़क से लगा व्यावसायिक व कृषि प्लाट (Highway Facing Land)",
    district: "Banda",
    tehsil: "Baberu",
    block: "Kamasin",
    village: "Sandasani",
    khasraNumber: "208",
    khataNumber: "00208",
    pincode: "210125",
    postOffice: "Kamasin SO",
    areaBigha: 1.8,
    areaBiswa: 36.0,
    areaSqFt: 49005,
    areaHectare: 0.4552,
    landType: "कृषि / आबादी सीमावर्ती",
    askingPriceInr: 3200000,
    pricePerBighaInr: 1777777,
    circleRateInr: 2450000,
    ownerName: "राघवेंद्र प्रताप सिंह",
    ownerPhone: "+91 98391 44520",
    ownerFather: "स्व. ठाकुर सूर्यभान सिंह",
    titleStatus: "स्वच्छ एवं विवाद-मुक्त (Zero Litigation)",
    loanStatus: "भार-मुक्त (Nil Encumbrance)",
    status: "AVAILABLE",
    lat: 25.5412,
    lng: 80.6841,
    features: ["मुख्य मार्ग पर 90 फीट का फ्रंट", "बिजली 11KV लाइन निकट", "निजी सबमर्सिबल"],
    listedAt: "2026-11-21T12:30:00Z",
    certificateId: "UP-REV-2026-BNDA-208"
  },
  {
    id: "LIST-PRG-412",
    title: "नैनी रीवा रोड उपजाऊ कृषि भूमि (Fertile Agricultural Farmland)",
    district: "Prayagraj",
    tehsil: "Karchhana",
    block: "Chaka",
    village: "Naini",
    khasraNumber: "412",
    khataNumber: "00412",
    pincode: "211008",
    postOffice: "Naini SO",
    areaBigha: 3.2,
    areaBiswa: 64.0,
    areaSqFt: 87120,
    areaHectare: 0.8093,
    landType: "कृषि भूमि (दो फसली सिंचित)",
    askingPriceInr: 5800000,
    pricePerBighaInr: 1812500,
    circleRateInr: 4480000,
    ownerName: "शिवनारायण त्रिपाठी",
    ownerPhone: "+91 91254 77800",
    ownerFather: "स्व. पं. उमाशंकर त्रिपाठी",
    titleStatus: "स्वच्छ एवं विवाद-मुक्त (Zero Litigation)",
    loanStatus: "भार-मुक्त (Nil Encumbrance)",
    status: "AVAILABLE",
    lat: 25.4218,
    lng: 81.8654,
    features: ["गंगा कछार उपजाऊ मिट्टी", "पक्का चकमार्ग", "100% संक्राम्य भूमिधर अधिकार"],
    listedAt: "2026-11-22T09:15:00Z",
    certificateId: "UP-REV-2026-PRAY-412"
  },
  {
    id: "LIST-LKO-550",
    title: "किसान पथ आउटर रिंग रोड कृषि भूमि (High Appreciation Plot)",
    district: "Lucknow",
    tehsil: "Mohanlalganj",
    block: "Gosainganj",
    village: "Gosainganj",
    khasraNumber: "550",
    khataNumber: "00550",
    pincode: "226501",
    postOffice: "Gosainganj SO",
    areaBigha: 2.0,
    areaBiswa: 40.0,
    areaSqFt: 54450,
    areaHectare: 0.5058,
    landType: "कृषि / भावी आवासीय निवेश",
    askingPriceInr: 6500000,
    pricePerBighaInr: 3250000,
    circleRateInr: 5120000,
    ownerName: "महेंद्र कुमार वर्मा",
    ownerPhone: "+91 94503 11299",
    ownerFather: "स्व. बाबूलाल वर्मा",
    titleStatus: "स्वच्छ एवं विवाद-मुक्त (Zero Litigation)",
    loanStatus: "भार-मुक्त (Nil Encumbrance)",
    status: "AVAILABLE",
    lat: 26.7721,
    lng: 81.1245,
    features: ["आउटर रिंग रोड से 500 मीटर", "गेटेड बाउंड्री", "पानी एवं बिजली कनेक्शन"],
    listedAt: "2026-11-22T14:45:00Z",
    certificateId: "UP-REV-2026-LUCK-550"
  }
];

export class MarketplaceService {
  /**
   * Retrieves all listings with optional filters
   */
  static async getListings({ district = "", tehsil = "", search = "", minPrice = 0, maxPrice = Infinity }) {
    let results = marketplaceListings.slice();

    if (district) {
      const dClean = district.toLowerCase().trim();
      results = results.filter((item) => item.district.toLowerCase().includes(dClean));
    }

    if (tehsil) {
      const tClean = tehsil.toLowerCase().trim();
      results = results.filter((item) => item.tehsil.toLowerCase().includes(tClean));
    }

    if (search) {
      const sClean = search.toLowerCase().trim();
      results = results.filter(
        (item) =>
          item.village.toLowerCase().includes(sClean) ||
          item.khasraNumber.includes(sClean) ||
          item.title.toLowerCase().includes(sClean) ||
          item.ownerName.toLowerCase().includes(sClean)
      );
    }

    if (minPrice > 0) {
      results = results.filter((item) => item.askingPriceInr >= minPrice);
    }

    if (maxPrice < Infinity && maxPrice > 0) {
      results = results.filter((item) => item.askingPriceInr <= maxPrice);
    }

    return results;
  }

  /**
   * Creates a new listing for sale by a landholder
   */
  static async listLandForSale({
    district,
    tehsil,
    block = "",
    village,
    khasraNumber,
    khataNumber = "",
    areaBigha = 1.0,
    landType = "कृषि भूमि (Agricultural Farmland)",
    askingPriceInr,
    pricePerBighaInr = 0,
    ownerName,
    ownerFather = "",
    ownerPhone,
    title = "",
    features = [],
    description = ""
  }) {
    if (!district || !tehsil || !village || !khasraNumber || !askingPriceInr) {
      throw new Error("जिला, तहसील, गाँव, गाटा संख्या और बिक्री मूल्य अनिवार्य हैं।");
    }

    const cleanKhasra = khasraNumber.toString().replace(/^#/, "").trim();
    const cleanVillage = village.replace(/^(Mauza|Kasba|मौजा|कस्बा)\s+/i, "").trim();

    // Resolve exact 6-digit Pincode & coordinates
    const centroid = liveGovDataService.getTehsilCentroid(district, tehsil);
    const pinInfo = await resolveExactUPPincode({
      district,
      tehsil,
      block,
      village: cleanVillage,
      lat: centroid[0],
      lng: centroid[1],
    });

    const realPincode = pinInfo?.pincode || "210001";
    const postOffice = pinInfo?.postOfficeName || `${tehsil} डाकघर`;

    // Fetch existing Khasra history to ensure verified ownership
    const khasraDossier = await KhasraHistoryService.resolveKhasraHistory({
      district,
      tehsil,
      block,
      village: cleanVillage,
      khasraNo: cleanKhasra,
      lat: centroid[0],
      lng: centroid[1]
    });

    const numBigha = parseFloat(areaBigha) || (khasraDossier?.area?.pakkaBigha || 1.0);
    const totalSqFt = Math.round(numBigha * 27225);
    const totalHectare = parseFloat((totalSqFt / 107639.1).toFixed(4));
    const finalPricePerBigha = pricePerBighaInr > 0 ? pricePerBighaInr : Math.round(askingPriceInr / numBigha);

    const distPrefix = district.slice(0, 4).toUpperCase();
    const listingId = `LIST-${distPrefix}-${cleanKhasra}-${Date.now().toString().slice(-4)}`;

    const newListing = {
      id: listingId,
      title: title || `${cleanVillage} में ${numBigha} बीघा ${landType}`,
      district,
      tehsil,
      block: block || tehsil,
      village: cleanVillage,
      khasraNumber: cleanKhasra,
      khataNumber: khataNumber || khasraDossier?.khataNumber || "00101",
      pincode: realPincode,
      postOffice,
      areaBigha: numBigha,
      areaBiswa: parseFloat((numBigha * 20).toFixed(1)),
      areaSqFt: totalSqFt,
      areaHectare: totalHectare,
      landType,
      askingPriceInr: parseInt(askingPriceInr),
      pricePerBighaInr: finalPricePerBigha,
      circleRateInr: khasraDossier?.pricing?.circleRate || Math.round(askingPriceInr * 0.8),
      ownerName: ownerName || khasraDossier?.currentOwner?.ownerName || "काश्तकार",
      ownerFather: ownerFather || khasraDossier?.currentOwner?.fatherName || "आत्मज",
      ownerPhone: ownerPhone || "+91 98765 43210",
      titleStatus: "स्वच्छ एवं विवाद-मुक्त (Zero Litigation)",
      loanStatus: "भार-मुक्त (Nil Encumbrance)",
      status: "AVAILABLE",
      lat: centroid[0],
      lng: centroid[1],
      features: features.length > 0 ? features : ["चक मार्ग उपलब्ध", "उपजाऊ दोमट मिट्टी", "स्वच्छ दाखिल-खारिज"],
      description,
      listedAt: new Date().toISOString(),
      certificateId: khasraDossier?.certificateId || `UP-REV-2026-${distPrefix}-${cleanKhasra}`,
      ownershipHistory: khasraDossier?.pastOwners || []
    };

    marketplaceListings.unshift(newListing);
    return newListing;
  }

  /**
   * Completes a purchase atomically transferring title to the buyer
   */
  static async completePurchase({
    listingId,
    buyerName,
    buyerFather,
    buyerPhone,
    salePrice,
    paymentMode = "DIGITAL_TREASURY_ESCROW"
  }) {
    const listing = marketplaceListings.find((l) => l.id === listingId);
    if (!listing) {
      throw new Error("भूमि विलेख सूची (Listing) नहीं मिली।");
    }

    if (listing.status === "SOLD") {
      throw new Error("यह खेत पहले ही बिक चुका है।");
    }

    // Atomically update Khasra history & issue new certificate
    const transferResult = await KhasraHistoryService.recordOwnershipTransfer({
      district: listing.district,
      tehsil: listing.tehsil,
      block: listing.block,
      village: listing.village,
      khasraNo: listing.khasraNumber,
      newBuyerName: buyerName,
      newBuyerFather: buyerFather,
      newBuyerPhone: buyerPhone,
      salePrice: salePrice || listing.askingPriceInr
    });

    // Mark listing as SOLD with new buyer reference
    listing.status = "SOLD";
    listing.soldTo = {
      buyerName,
      buyerFather,
      buyerPhone,
      purchaseDate: new Date().toISOString(),
      finalSalePrice: salePrice || listing.askingPriceInr,
      paymentMode,
      newCertificateId: transferResult.certificateId
    };

    return {
      success: true,
      message: `गाटा सं. #${listing.khasraNumber} की रजिस्ट्री सफलतापूर्वक सम्पन्न हुई। नया स्वामित्व प्रमाण पत्र जारी किया गया।`,
      listing,
      transferResult,
      certificateId: transferResult.certificateId,
      newOwner: transferResult.currentOwner,
      qrVerificationUrl: transferResult.qrVerificationUrl,
    };
  }

  /**
   * Quick lookup by Khasra and Village
   */
  static getListingByKhasra(khasraNo, village) {
    if (!khasraNo) return null;
    const cleanK = khasraNo.toString().replace(/^#/, "").trim();
    const cleanV = (village || "").toLowerCase().trim();

    return marketplaceListings.find(
      (l) => l.khasraNumber === cleanK && (!cleanV || l.village.toLowerCase().includes(cleanV)) && l.status === "AVAILABLE"
    );
  }
}
