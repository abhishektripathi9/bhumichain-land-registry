import React, { createContext, useContext, useState, useEffect } from "react";

export const translations = {
  hi: {
    // Navigation
    exploreMap: "नक्शा देखें",
    registerLand: "भूमि पंजीकरण",
    myProperties: "मेरी संपत्तियाँ",
    verifyQR: "क्यूआर सत्यापन",
    polygonActive: "पॉलीगॉन मेननेट सक्रिय",
    scanGPS: "लाइव जीपीएस स्कैन करें",
    citizenLoginBtn: "UP नागरिक / किसान लॉगिन",
    sovereignLedger: "सार्वभौमिक लेज़र नोड #082 • प्रयागराज",
    switchCitizenWallet: "नागरिक वॉलेट बदलें",
    enterAdminConsole: "सब-रजिस्ट्रार एडमिन कंसोल",
    connectExternal: "बाहरी मेटामास्क कनेक्ट करें",
    verifiedKYC: "सत्यापित ई-केवाईसी",

    // Citizen Modal
    portalGov: "उत्तर प्रदेश सरकार",
    portalTitle: "उत्तर प्रदेश राजस्व परिषद • किसान व नागरिक पोर्टल",
    portalSub: "भूलेख अभिलेख व रीयल-टाइम डिजिटल नागरिक पहचान प्रणाली",
    tabLogin: "1. त्वरित लॉगिन (नागरिक)",
    tabRegister: "2. नया किसान/नागरिक पंजीकरण",
    phoneLabel: "पंजीकृत मोबाइल नंबर",
    otpLabel: "उत्तर प्रदेश ई-केवाईसी Mock OTP",
    otpMockText: "Mock OTP स्वतः भरा गया: 782194",
    quickFarmers: "एक-क्लिक में किसान/नागरिक चुनें:",
    loginSubmit: "सुरक्षित ई-केवाईसी लॉगिन करें",
    nameLabel: "पूरा नाम *",
    aadhaarLabel: "आधार संदर्भ / पहचान संख्या",
    roleLabel: "नागरिक श्रेणी",
    districtLabel: "जनपद (District)",
    tehsilLabel: "तहसील (Tehsil)",
    villageLabel: "ग्राम / मौजा",
    khasraNumLabel: "खसरा / गाटा संख्या (यदि भूमि हो)",
    registerSubmit: "उत्तर प्रदेश ई-केवाईसी सत्यापित करें व रजिस्टर करें",
    farmerRole: "🌾 किसान / भूमि स्वामी (Farmer)",
    buyerRole: "👨‍💼 क्रेता / नागरिक (Buyer)",
    advocateRole: "⚖️ अधिवक्ता / डीड लेखक",

    // Search & Map Bar
    selectDistrict: "जनपद",
    selectTehsil: "तहसील:",
    selectVillage: "ग्राम:",
    khasraPlaceholder: "खसरा / खेत नं. दर्ज करें (उदा. 104, 105, 142/1)",
    searchBtn: "खोजें",
    turnOnGps: "लाइव लोकेशन चालू करें",
    quickKhasra: "त्वरित खसरा:",
    nearbyDrawerTitle: "🌾 आपके लाइव स्थान के निकटतम खेत",
    highlightOnMap: "नक्शे पर हाइलाइट करें",
    call: "कॉल",
    whatsapp: "व्हाट्सएप",
    viewDossier: "पूर्ण विवरण",
    legendTitle: "कैडस्ट्रल जीआईएस संकेत (Legend)",
    legendSelected: "चयनित / खोजा गया",
    legendForSale: "बिक्री हेतु उपलब्ध",
    legendVerified: "प्रमाणित स्वामित्व",
    legendDisputed: "विवादित / कोर्ट केस",
    bhuNakshaSatellite: "भू-नक्शा + सैटेलाइट",

    // Land Dossier
    khasraPrefix: "खसरा #",
    selectedKhet: "चयनित खेत",
    blockchainVerified: "राजस्व अभिलेख प्रमाणित",
    rwaToken: "RWA टोकन",
    valuationTitle: "भूमि विवरण व मूल्यांकन (VALUATION)",
    cropUsage: "फसल / उपयोग:",
    circleRate: "सर्किल दर:",
    govtValuation: "सरकारी मूल्यांकन:",
    totalArea: "कुल क्षेत्रफल (AREA)",
    khataNumber: "खतौनी खाता संख्या",
    gataNumber: "गाटा सं.",
    bankLien: "बैंक बंधक / भार (LIEN)",
    disputeStatus: "विवाद व न्यायालय स्थिति (LITIGATION)",
    registeredOwner: "पंजीकृत भूमि स्वामी (REGISTERED OWNER)",
    regPhone: "पंजीकृत मोबाइल नंबर",
    ownerWallet: "स्वामी वेब3 वॉलेट",
    directContact: "मालिक से सीधा संपर्क करें (DIRECT CONTACT):",
    callOwner: "कॉल करें",
    whatsappMessage: "व्हाट्सएप संदेश",
    inAppChat: "सुरक्षित इन-ऐप P2P चैट (Web3 Chat)",
    dgpsCoords: "खेत सीमा निर्देशांक (DGPS Coordinates)",
    buyEscrow: "स्मार्ट कॉन्ट्रैक्ट एस्क्रो से खरीदें",
    escrowSubtext: "7-दिवसीय रजिस्ट्री आपत्ति अवधि के साथ ऑडिटेड एस्क्रो अनुबंध में 10% बयाना राशि लॉक करता है।",
    downloadPdf: "प्रमाणित लैंड डॉसियर (PDF) डाउनलोड करें",
    viewKhatauniNakal: "पूर्ण 13-कॉलम खतौनी नकल देखें",
    chauhaddiTitle: "खेत चौहद्दी विवरण (Chauhaddi)",
    forSaleText: "बिक्री हेतु उपलब्ध (For Sale)",
    notForSaleText: "स्वामित्व प्रमाणित (बिक्री हेतु नहीं)",
    restrictedListing: "मालिक द्वारा सूची प्रतिबंधित",

    // Footer
    footerTitle: "भूमिचेन • उत्तर प्रदेश सरकार",
    footerDesc: "राजस्व विभाग एवं कैडस्ट्रल जीआईएस लेज़र नोड #082 • प्रयागराज मंडल",
    officerGateway: "अधिकारी प्रवेश द्वार",
    langName: "हिंदी",
    switchTo: "English",
  },
  en: {
    // Navigation
    exploreMap: "Explore Map",
    registerLand: "Register Land",
    myProperties: "My Properties",
    verifyQR: "Verify QR",
    polygonActive: "Polygon Mainnet Active",
    scanGPS: "Scan My GPS Location",
    citizenLoginBtn: "UP Citizen / Farmer Login",
    sovereignLedger: "उत्तर प्रदेश डिजिटल भूलेख पोर्टल",
    switchCitizenWallet: "Switch Citizen Profile",
    enterAdminConsole: "Enter Officer Admin Console",
    connectExternal: "Connect External Wallet",
    verifiedKYC: "प्रमाणित खाता",

    // Citizen Modal
    portalGov: "GOVERNMENT OF UTTAR PRADESH",
    portalTitle: "UP Board of Revenue • Citizen & Farmer Portal",
    portalSub: "UP Bhulekh Land Records & Real-Time Citizen Identity Gateway",
    tabLogin: "1. Quick Citizen Login",
    tabRegister: "2. New Farmer/Citizen Registration",
    phoneLabel: "Registered Mobile Number",
    otpLabel: "UP e-KYC Mock OTP",
    otpMockText: "Mock OTP Auto-Filled: 782194",
    quickFarmers: "One-Click Demo UP Farmers:",
    loginSubmit: "Verify e-KYC & Login",
    nameLabel: "Full Name *",
    aadhaarLabel: "Aadhaar / ID Reference",
    roleLabel: "Citizen Category",
    districtLabel: "District",
    tehsilLabel: "Tehsil",
    villageLabel: "Village / Mauza",
    khasraNumLabel: "Khasra / Gata Number (If owning land)",
    registerSubmit: "Verify UP e-KYC & Complete Registration",
    farmerRole: "🌾 Farmer / Land Owner",
    buyerRole: "👨‍💼 Buyer / Citizen",
    advocateRole: "⚖️ Advocate / Deed Writer",

    // Search & Map Bar
    selectDistrict: "District",
    selectTehsil: "Tehsil:",
    selectVillage: "Village:",
    khasraPlaceholder: "Enter Khasra / Farm No. (e.g. 104, 105, 142/1)",
    searchBtn: "Search",
    turnOnGps: "Turn On Live Location",
    quickKhasra: "Quick Khasra:",
    nearbyDrawerTitle: "🌾 Nearby Farms Around Your Live Location",
    highlightOnMap: "Highlight on Map",
    call: "Call",
    whatsapp: "WhatsApp",
    viewDossier: "Full Dossier",
    legendTitle: "Cadastral GIS Legend",
    legendSelected: "Selected / Searched",
    legendForSale: "For Sale (Escrow Ready)",
    legendVerified: "Verified Clear Title",
    legendDisputed: "Disputed / Litigation",
    bhuNakshaSatellite: "Bhu-Naksha + Satellite",

    // Land Dossier
    khasraPrefix: "Khasra #",
    selectedKhet: "Selected Farm",
    blockchainVerified: "Revenue Records Verified",
    rwaToken: "RWA Token",
    valuationTitle: "LAND PARTICULARS & VALUATION",
    cropUsage: "Crop / Usage:",
    circleRate: "Circle Rate:",
    govtValuation: "Govt Valuation:",
    totalArea: "TOTAL LAND AREA",
    khataNumber: "KHATAUNI KHATA NO.",
    gataNumber: "Gata No.",
    bankLien: "BANK LIEN STATUS",
    disputeStatus: "DISPUTE & LITIGATION STATUS",
    registeredOwner: "REGISTERED LEGAL OWNER",
    regPhone: "REGISTERED PHONE",
    ownerWallet: "OWNER WEB3 WALLET",
    directContact: "DIRECT OWNER CONTACT:",
    callOwner: "Call Owner",
    whatsappMessage: "WhatsApp Message",
    inAppChat: "Encrypted P2P In-App Chat",
    dgpsCoords: "Cadastral DGPS Coordinates",
    buyEscrow: "Buy via Smart Contract Escrow",
    escrowSubtext: "Locks 10% earnest deposit into audited escrow contract with 7-day registry objection window.",
    downloadPdf: "Download Certified Land Dossier (PDF)",
    viewKhatauniNakal: "View 13-Column Khatauni Nakal",
    chauhaddiTitle: "Cadastral Chauhaddi Boundaries",
    forSaleText: "For Sale (Escrow Ready)",
    notForSaleText: "Verified Title (Not For Sale)",
    restrictedListing: "Listing Restricted by Owner",

    // Footer
    footerTitle: "BhumiChain • Government of Uttar Pradesh",
    footerDesc: "Revenue Department & Cadastral GIS Ledger Node #082 • Prayagraj Division",
    officerGateway: "Officer Gateway",
    langName: "English",
    switchTo: "हिंदी",
  },
};

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    try {
      const saved = localStorage.getItem("bhumichain_lang");
      if (saved === "en" || saved === "hi") return saved;
    } catch (e) {}
    return "hi"; // Default to Hindi as per user's primary requirement
  });

  useEffect(() => {
    try {
      localStorage.setItem("bhumichain_lang", language);
    } catch (e) {}
  }, [language]);

  const toggleLanguage = () => {
    setLanguage((prev) => (prev === "hi" ? "en" : "hi"));
  };

  const t = (key) => {
    return translations[language]?.[key] || translations["en"]?.[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
