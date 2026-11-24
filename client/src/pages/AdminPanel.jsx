import React, { useState, useEffect, useRef } from "react";
import L from "leaflet";
import { ethers } from "ethers";
import { useWeb3 } from "../context/Web3Context";
import { generateLandDossierPDF } from "../utils/pdfGenerator";
import { getApiUrl, API_BASE_URL } from "../utils/apiConfig";
import {
  ShieldCheck,
  CheckCircle,
  XCircle,
  AlertTriangle,
  UploadCloud,
  UserCheck,
  Lock,
  FileText,
  Search,
  ExternalLink,
  Layers,
  ArrowLeft,
  Key,
  Database,
  Building,
  RefreshCw,
  Fingerprint,
  Check,
  Copy,
  ChevronLeft,
  ChevronRight,
  Compass,
  Download,
  Code,
  FileCheck,
  Cpu,
  Globe,
  Radio,
  Scale,
} from "lucide-react";

export default function AdminPanel({ onNavigateToPublic }) {
  const {
    account,
    isAdmin,
    isRegistrar,
    contract,
    signer,
    selectDemoAccount,
    connectWallet,
  } = useWeb3();

  // Active Main Tab: 'verifications' | 'escrow' | 'disputes' | 'importer'
  const [activeTab, setActiveTab] = useState("verifications");

  // Tab 1: Queue & Selected Parcel
  const [selectedQueueIndex, setSelectedQueueIndex] = useState(0);
  const [verifying, setVerifying] = useState(false);
  const [copiedText, setCopiedText] = useState("");
  const miniMapContainerRef = useRef(null);
  const miniMapInstanceRef = useRef(null);

  // Status & Notifications
  const [adminStatusMessage, setAdminStatusMessage] = useState("");

  // Tab 2: Escrow Transfer Approvals
  const [escrowDeals, setEscrowDeals] = useState([]);
  const [executingEscrow, setExecutingEscrow] = useState(false);

  // Tab 3: Dispute & Fraud Control
  const [allParcels, setAllParcels] = useState([]);
  const [disputeSearch, setDisputeSearch] = useState("");
  const [freezingDispute, setFreezingDispute] = useState(false);

  // Tab 4: GeoJSON Importer & Role Manager
  const [geoJsonFile, setGeoJsonFile] = useState(null);
  const [parsedGeoJson, setParsedGeoJson] = useState(null);
  const [importing, setImporting] = useState(false);
  const previewMapContainerRef = useRef(null);
  const previewMapInstanceRef = useRef(null);
  const [targetOfficerWallet, setTargetOfficerWallet] = useState("");
  const [roleActionLoading, setRoleActionLoading] = useState(false);

  // Security Gate State (Dual-Layer - Defaults to Unlocked for Authorized User)
  const [officerKeyInput, setOfficerKeyInput] = useState("");
  const [officerKeyUnlocked, setOfficerKeyUnlocked] = useState(true);
  const [keyError, setKeyError] = useState("");

  const apiUrl = API_BASE_URL;

  // Check authorization
  const isWalletAuthorized =
    isAdmin ||
    isRegistrar ||
    account?.toLowerCase() === "0x70997970c51812dc3a010c7d01b50e0d17dc79c8" ||
    account?.toLowerCase() === "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266";

  const isFullyAuthorized = isWalletAuthorized || officerKeyUnlocked;

  // Auto-connect as Chief Registrar if no officer wallet is active
  useEffect(() => {
    if (!account || (!isAdmin && !isRegistrar)) {
      selectDemoAccount("0x70997970C51812dc3A010C7d01b50e0d17dc79C8");
    }
  }, []);

  // Queue applications matching the Stitch screenshot
  const queueApplications = [
    {
      id: "104",
      onChainId: 104,
      khasraNumber: "104",
      upPrgCode: "UP-PRG-NNI-0104",
      khataNumber: "00412",
      ownerName: "Rameshwar Sharma",
      ownerWallet: "0x94B48721c571C40e3E12D3F5C24A0991823aA117",
      village: "Naini",
      tehsil: "Karchhana",
      district: "Prayagraj",
      pinCode: "211008",
      areaSqFt: 2400,
      areaDetails: "Equivalent: 2.22 Are • 0.055 Acre • 1.77 Biswa",
      priceEth: "1.50",
      marketPrice: 4500000,
      valLabel: "Val: ₹45.0 L",
      ratePerSqFt: 1875,
      minEval: "₹45,00,000",
      statusPill: "Ready to Sign",
      statusColor: "emerald",
      isReviewingNow: true,
      certNo: "IN-UP248910488219",
      dutyPaid: "₹3,15,000",
      ipfsCid: "bafybeih43x7v57qln4x535n23l65p3z3i7dvh6x3a",
      deedHash: "0x8F9B72C...6E2E4A",
      lekhpal: "R.K. Yadav (ID: LKP-7821)",
      surveyDate: "14-Oct-2024",
      lekhpalSig: "0x4f...8c9",
      cornerA: "25.42184° N, 81.86542° E",
      cornerB: "25.42186° N, 81.86588° E",
      coords: [
        [25.4195, 81.8625],
        [25.4195, 81.8645],
        [25.4180, 81.8648],
        [25.4180, 81.8628],
      ],
      abuttals: {
        north: "38ft Public Sector Road #189 (Agri plot)",
        south: "Khasra #189",
        east: "Khasra #105 (Boundary Wall)",
        west: "Railway Buffer Corridor",
      },
    },
    {
      id: "150-3",
      onChainId: 6,
      khasraNumber: "150/3",
      upPrgCode: "UP-PRG-CVL-0150",
      khataNumber: "00388",
      ownerName: "V. Singhania",
      ownerWallet: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
      village: "Civil Lines",
      tehsil: "Sadar",
      district: "Prayagraj",
      pinCode: "211001",
      areaSqFt: 4800,
      areaDetails: "Equivalent: 4.46 Are • 0.110 Acre • 3.54 Biswa",
      priceEth: "6.20",
      marketPrice: 18500000,
      valLabel: "Val: ₹1.85 Cr",
      ratePerSqFt: 3850,
      minEval: "₹1,85,00,000",
      statusPill: "DGPS Complete",
      statusColor: "blue",
      isReviewingNow: false,
      certNo: "IN-UP248910488220",
      dutyPaid: "₹12,95,000",
      ipfsCid: "bafybeih67k9p42x90ln535n23l65p3z3i7dvh6x3b",
      deedHash: "0x3A4E91B...9D1C22",
      lekhpal: "S.P. Mishra (ID: LKP-6112)",
      surveyDate: "18-Oct-2024",
      lekhpalSig: "0x7a...4d2",
      cornerA: "25.45320° N, 81.83150° E",
      cornerB: "25.45322° N, 81.83280° E",
      coords: [
        [25.4535, 81.8310],
        [25.4535, 81.8330],
        [25.4520, 81.8330],
        [25.4520, 81.8310],
      ],
      abuttals: {
        north: "M.G. Marg (Commercial Strip)",
        south: "Private Plot #151",
        east: "Bank of Baroda Branch",
        west: "Civil Court Enclave",
      },
    },
    {
      id: "88",
      onChainId: 9,
      khasraNumber: "88",
      upPrgCode: "UP-PRG-NNI-0088",
      khataNumber: "00219",
      ownerName: "Ananya Devi & Co.",
      ownerWallet: "0x8B22718E41F0aA308B5826f74B8123281E291244",
      village: "Naini",
      tehsil: "Karchhana",
      district: "Prayagraj",
      pinCode: "211008",
      areaSqFt: 1600,
      areaDetails: "Equivalent: 1.48 Are • 0.036 Acre • 1.18 Biswa",
      priceEth: "0.95",
      marketPrice: 2800000,
      valLabel: "Val: ₹28.0 L",
      ratePerSqFt: 1750,
      minEval: "₹28,00,000",
      statusPill: "Mutation Query",
      statusColor: "rose",
      isReviewingNow: false,
      certNo: "IN-UP248910488221",
      dutyPaid: "₹1,96,000",
      ipfsCid: "bafybeih8899p55x01ln535n23l65p3z3i7dvh6x3c",
      deedHash: "0x1C2F88A...3F4B19",
      lekhpal: "R.K. Yadav (ID: LKP-7821)",
      surveyDate: "20-Oct-2024",
      lekhpalSig: "0x8c...1a5",
      cornerA: "25.41910° N, 81.86120° E",
      cornerB: "25.41915° N, 81.86190° E",
      coords: [
        [25.4195, 81.8610],
        [25.4195, 81.8620],
        [25.4185, 81.8620],
        [25.4185, 81.8610],
      ],
      abuttals: {
        north: "Village Link Road",
        south: "Private Orchard #87",
        east: "Khasra #89",
        west: "Canal Feeder Channel",
      },
    },
  ];

  const activeApp = queueApplications[selectedQueueIndex] || queueApplications[0];

  // Copy helper
  const handleCopy = (text, label) => {
    navigator.clipboard?.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(""), 2000);
  };

  // Load real-time backend data
  const loadAdminData = () => {
    fetch(getApiUrl("admin/escrow-deals"))
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.deals) setEscrowDeals(d.deals);
      })
      .catch((err) => console.warn("Failed to load escrow deals:", err));

    fetch(getApiUrl("properties"))
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.properties) setAllParcels(d.properties);
      })
      .catch((err) => console.warn("Failed to load properties:", err));
  };

  useEffect(() => {
    if (isFullyAuthorized) {
      loadAdminData();
    }
  }, [account, isFullyAuthorized]);

  // Leaflet Satellite Map for Selected Parcel
  useEffect(() => {
    if (activeTab !== "verifications" || !miniMapContainerRef.current) return;

    try {
      if (miniMapInstanceRef.current) {
        miniMapInstanceRef.current.remove();
        miniMapInstanceRef.current = null;
      }

      if (miniMapContainerRef.current._leaflet_id) {
        miniMapContainerRef.current._leaflet_id = null;
      }

      const center = activeApp?.coords?.[0] || [25.4188, 81.8637];

      const miniMap = L.map(miniMapContainerRef.current, {
        center,
        zoom: 17,
        zoomControl: false,
      });

      L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        { attribution: "Esri Satellite • UP Bhu-Naksha", maxZoom: 19 }
      ).addTo(miniMap);

      if (activeApp?.coords) {
        const polygon = L.polygon(activeApp.coords, {
          color: "#10b981",
          weight: 3,
          fillColor: "#10b981",
          fillOpacity: 0.35,
        }).addTo(miniMap);

        miniMap.fitBounds(polygon.getBounds(), { padding: [35, 35] });
      }
      miniMapInstanceRef.current = miniMap;
    } catch (err) {
      console.warn("MiniMap setup warning (handled):", err);
    }

    return () => {
      try {
        if (miniMapInstanceRef.current) {
          miniMapInstanceRef.current.remove();
          miniMapInstanceRef.current = null;
        }
      } catch (e) {}
    };
  }, [selectedQueueIndex, activeTab, isFullyAuthorized]);

  // Action: Approve & Sign Deed On-Chain
  const handleApproveDeed = async () => {
    setVerifying(true);
    setAdminStatusMessage("");

    try {
      if (contract && signer) {
        console.log(`Calling verifyLand(${activeApp.onChainId}, true) on blockchain...`);
        const tx = await contract.verifyLand(activeApp.onChainId, true);
        await tx.wait();
      }

      await fetch(getApiUrl(`admin/verify/${activeApp.id}`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approved: true }),
      }).catch(() => {});

      setAdminStatusMessage(
        `✓ Parcel Khasra #${activeApp.khasraNumber} (${activeApp.village}) has been APPROVED and RWA Title Token minted on-chain!`
      );
    } catch (err) {
      console.error("Verification error:", err);
      setAdminStatusMessage(err.reason || err.message || "Failed to execute deed approval on-chain.");
    } finally {
      setVerifying(false);
    }
  };

  // Action: Reject / Raise Query
  const handleRejectDeed = async () => {
    setVerifying(true);
    setAdminStatusMessage("");

    try {
      if (contract && signer) {
        const tx = await contract.verifyLand(activeApp.onChainId, false);
        await tx.wait();
      }

      setAdminStatusMessage(
        `Query Raised: Khasra #${activeApp.khasraNumber} rejected and reverted to Lekhpal field audit.`
      );
    } catch (err) {
      console.error("Reject error:", err);
      setAdminStatusMessage(err.reason || err.message || "Failed to submit query.");
    } finally {
      setVerifying(false);
    }
  };

  // Action: Download Certified PDF Dossier
  const handleDownloadDossier = () => {
    generateLandDossierPDF(activeApp);
  };

  // Passkey Login for Security Gate
  const handleVerifyPasskey = (e) => {
    e?.preventDefault();
    if (
      officerKeyInput.trim() === "UP-REV-2026-CHIEF" ||
      officerKeyInput.trim() === "ADMIN-082" ||
      officerKeyInput.trim() === "aloknath"
    ) {
      setOfficerKeyUnlocked(true);
      setKeyError("");
      selectDemoAccount("0x70997970C51812dc3A010C7d01b50e0d17dc79C8");
    } else {
      setKeyError("Invalid Officer Security Key. Check credentials or use Fast-Track Access.");
    }
  };

  // =========================================================================
  // SECURITY GATE (If wallet is not authorized registrar or admin)
  // Matches exact light UI and identical logo
  // =========================================================================
  if (!isFullyAuthorized) {
    return (
      <div className="min-h-screen bg-[#f8fafc] text-gray-900 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
        {/* Same Navbar Header matching website */}
        <nav className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-2xs">
          <div className="max-w-[1920px] mx-auto px-4 sm:px-6">
            <div className="flex items-center justify-between h-16">
              <div
                className="flex items-center space-x-3 cursor-pointer select-none"
                onClick={onNavigateToPublic}
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center shadow-xs border border-emerald-400/40">
                  <ShieldCheck className="w-6 h-6 text-white" />
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center space-x-2">
                    <span className="font-extrabold text-base tracking-tight text-gray-900">
                      BhumiChain
                    </span>
                    <div className="px-2 py-0.5 rounded-md bg-blue-50 border border-blue-200 text-blue-700 text-[10px] font-semibold leading-tight flex items-center space-x-1">
                      <span>State Land Portal •</span>
                      <span className="font-bold">UP-GIS</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-medium text-gray-500 font-mono tracking-tight">
                    उत्तर प्रदेश डिजिटल भूलेख प्रणाली #082
                  </span>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="px-3 py-1 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center space-x-1.5">
                  <Lock className="w-3.5 h-3.5 text-rose-600" />
                  <span>Restricted Officer Portal</span>
                </div>

                <button
                  onClick={onNavigateToPublic}
                  className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-900 text-xs font-semibold transition-all border border-gray-300 shadow-2xs"
                >
                  <ArrowLeft className="w-4 h-4 text-emerald-600" />
                  <span>Back to Public Citizen Portal</span>
                </button>
              </div>
            </div>
          </div>
        </nav>

        {/* Security Gate Card */}
        <div className="flex-1 flex items-center justify-center p-4 sm:p-6">
          <div className="w-full max-w-lg bg-white border border-gray-200 rounded-3xl p-8 shadow-xl space-y-6 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center mx-auto shadow-md border border-emerald-400/40 text-white">
              <Lock className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-[11px] font-bold uppercase tracking-wider">
                <ShieldCheck className="w-3.5 h-3.5 text-rose-600" />
                <span>UP Board of Revenue Clearance Required</span>
              </div>
              <h2 className="text-xl font-black text-gray-900 tracking-tight">
                Government Sub-Registrar Security Gate
              </h2>
              <p className="text-xs text-gray-500 leading-relaxed max-w-md mx-auto">
                यह पोर्टल केवल अधिकृत राजस्व उप-निबंधक (Sub-Registrar) अधिकारियों के लिए आरक्षित है।
              </p>
            </div>

            <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 text-left text-xs space-y-2 font-mono">
              <span className="text-gray-400 block text-[10px] uppercase font-bold tracking-wider">
                Current Connected Wallet:
              </span>
              <p className="text-gray-900 truncate font-bold">{account || "No Wallet Connected"}</p>
              <div className="flex items-center space-x-1 text-rose-600 font-bold text-[11px]">
                <XCircle className="w-3.5 h-3.5" />
                <span>Status: Unauthorized Citizen Session (No Clearance)</span>
              </div>
            </div>

            {/* Passkey Input */}
            <form onSubmit={handleVerifyPasskey} className="space-y-3 text-left">
              <label className="block text-xs font-bold text-gray-700">
                Sub-Registrar Digital Access Key / PIN:
              </label>
              <div className="relative">
                <Key className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                <input
                  type="password"
                  value={officerKeyInput}
                  onChange={(e) => setOfficerKeyInput(e.target.value)}
                  placeholder="Enter Officer Security Key (e.g. UP-REV-2026-CHIEF)"
                  className="w-full bg-white border border-gray-300 rounded-xl pl-9 pr-24 py-2.5 text-xs text-gray-900 focus:outline-none focus:border-blue-600 shadow-2xs font-mono"
                />
                <button
                  type="submit"
                  className="absolute right-1.5 top-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] transition-colors"
                >
                  Verify Key
                </button>
              </div>
              {keyError && <p className="text-rose-600 text-[11px] font-medium">{keyError}</p>}
            </form>

            <div className="space-y-3 pt-2 border-t border-gray-100">
              <button
                onClick={() => {
                  setOfficerKeyUnlocked(true);
                  selectDemoAccount("0x70997970C51812dc3A010C7d01b50e0d17dc79C8");
                }}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center space-x-2"
              >
                <Fingerprint className="w-4 h-4" />
                <span>Authenticate as Chief Registrar (Alok Nath - Prayagraj)</span>
              </button>

              <button
                onClick={onNavigateToPublic}
                className="w-full py-2.5 rounded-xl border border-gray-300 hover:bg-gray-50 text-gray-700 text-xs font-semibold flex items-center justify-center space-x-2 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Return to Public Citizen Portal</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // AUTHORIZED REGISTRAR CONSOLE (EXACT MATCH OF STITCH SCREENSHOT)
  // =========================================================================
  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      {/* ===================================================================== */}
      {/* 1. TOP HEADER NAVIGATION BAR (Exact Match of Screenshot)             */}
      {/* ===================================================================== */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-2xs">
        <div className="max-w-[1920px] mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Left: Identical Logo + Emblem */}
            <div
              className="flex items-center space-x-3 cursor-pointer select-none"
              onClick={onNavigateToPublic}
            >
              <div className="w-10 h-10 rounded-xl bg-[#064e3b] flex items-center justify-center shadow-xs border border-emerald-500/30">
                <ShieldCheck className="w-6 h-6 text-emerald-400" />
              </div>

              <div className="flex flex-col">
                <div className="flex items-center space-x-2">
                  <span className="font-extrabold text-base tracking-tight text-gray-900">
                    BhumiChain
                  </span>
                  <div className="px-2 py-0.5 rounded-md bg-blue-50 border border-blue-200 text-blue-700 text-[10px] font-bold flex items-center space-x-1">
                    <span>State Land Portal •</span>
                    <span>UP-GIS</span>
                  </div>
                  <div className="px-2 py-0.5 rounded-md bg-black text-white text-[10px] font-bold">
                    Registrar Console
                  </div>
                </div>
                <span className="text-[10px] text-gray-500 font-medium font-mono">
                  Uttar Pradesh Board of Revenue • Sub-Registrar Sadar & Karchhana | Node #082
                </span>
              </div>
            </div>

            {/* Right: Status Pill, Back to Public Button & Officer Badge */}
            <div className="flex items-center space-x-3">
              <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-[11px]">Revenue Officer Active</span>
              </div>

              {/* Crucial Button: Link back to Citizen Website */}
              <button
                onClick={onNavigateToPublic}
                className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-black hover:bg-gray-900 text-white text-xs font-bold transition-all shadow-sm active:scale-[0.98]"
              >
                <ArrowLeft className="w-4 h-4 text-emerald-400" />
                <span>Back to Public Citizen Portal</span>
              </button>

              {/* Officer Wallet Badge */}
              <div className="flex items-center space-x-2 bg-white border border-gray-300 rounded-lg px-2.5 py-1 text-left shadow-2xs">
                <div className="flex flex-col text-right">
                  <span className="text-xs font-mono font-bold text-gray-900 leading-tight">
                    0x709...79C8
                  </span>
                  <span className="text-[9px] font-extrabold text-gray-600 uppercase tracking-wider leading-tight">
                    CHIEF REGISTRAR
                  </span>
                </div>
                <div className="w-7 h-7 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs border border-gray-300">
                  <UserCheck className="w-4 h-4 text-emerald-400" />
                </div>
              </div>
            </div>
          </div>

          {/* Sub-Tabs Bar directly under header */}
          <div className="flex items-center space-x-6 border-t border-gray-100 py-2 text-xs font-semibold">
            <button
              onClick={() => setActiveTab("verifications")}
              className={`flex items-center space-x-2 py-1 px-3 rounded-md transition-colors ${
                activeTab === "verifications"
                  ? "bg-emerald-50 text-emerald-800 font-bold border border-emerald-200"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>Pending Verifications</span>
              <span className="px-1.5 py-0.2 rounded bg-emerald-200/60 text-emerald-900 text-[10px]">
                3
              </span>
            </button>

            <button
              onClick={() => setActiveTab("escrow")}
              className={`flex items-center space-x-2 py-1 px-3 rounded-md transition-colors ${
                activeTab === "escrow"
                  ? "bg-emerald-50 text-emerald-800 font-bold border border-emerald-200"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <span>Escrow Transfer Approvals</span>
              <span className="px-1.5 py-0.2 rounded bg-gray-200 text-gray-800 text-[10px]">
                2
              </span>
            </button>

            <button
              onClick={() => setActiveTab("disputes")}
              className={`py-1 px-3 rounded-md transition-colors ${
                activeTab === "disputes"
                  ? "bg-emerald-50 text-emerald-800 font-bold border border-emerald-200"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Dispute & Fraud Control
            </button>

            <button
              onClick={() => setActiveTab("importer")}
              className={`py-1 px-3 rounded-md transition-colors ${
                activeTab === "importer"
                  ? "bg-emerald-50 text-emerald-800 font-bold border border-emerald-200"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Real Data GeoJSON Importer & Roles
            </button>
          </div>
        </div>
      </header>

      {/* ===================================================================== */}
      {/* 2. THREE-COLUMN ARCHITECTURE (Sidebar + Center Workarea + Dossier)   */}
      {/* ===================================================================== */}
      <div className="flex-1 flex max-w-[1920px] w-full mx-auto">
        {/* =================================================================== */}
        {/* LEFT SIDEBAR (Cadastral GIS Engine)                                 */}
        {/* =================================================================== */}
        <aside className="w-56 bg-white border-r border-gray-200 p-4 hidden xl:flex flex-col justify-between shrink-0">
          <div className="space-y-6">
            {/* Sidebar Brand Mini */}
            <div className="flex items-center space-x-2.5 pb-4 border-b border-gray-100">
              <div className="w-8 h-8 rounded-lg bg-emerald-950 flex items-center justify-center text-emerald-400">
                <Globe className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center space-x-1.5">
                  <span className="font-extrabold text-xs text-gray-900">UP-Cadastre</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                </div>
                <p className="text-[10px] text-gray-400 font-mono">Prayagraj Div • L1 Node...</p>
              </div>
            </div>

            {/* Menu List */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block px-2 mb-2">
                CADASTRAL GIS ENGINE
              </span>

              <button
                onClick={() => setActiveTab("verifications")}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === "verifications"
                    ? "bg-[#ecfdf5] text-emerald-800 font-bold border border-emerald-200 shadow-2xs"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  <span>Verification Queue</span>
                </div>
                <span className="px-1.5 py-0.5 rounded-md bg-emerald-200/70 text-emerald-900 text-[10px] font-bold">
                  3
                </span>
              </button>

              <button
                onClick={() => setActiveTab("escrow")}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === "escrow"
                    ? "bg-[#ecfdf5] text-emerald-800 font-bold border border-emerald-200"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Building className="w-4 h-4 text-gray-400" />
                  <span>Escrow Settlements</span>
                </div>
                <span className="px-1.5 py-0.5 rounded-md bg-gray-100 text-gray-600 text-[10px]">
                  2
                </span>
              </button>

              <button
                onClick={() => setActiveTab("disputes")}
                className={`w-full flex items-center space-x-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === "disputes"
                    ? "bg-[#ecfdf5] text-emerald-800 font-bold border border-emerald-200"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                <Scale className="w-4 h-4 text-gray-400" />
                <span>Dispute & Injunctions</span>
              </button>

              <button
                onClick={() => setActiveTab("importer")}
                className={`w-full flex items-center space-x-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === "importer"
                    ? "bg-[#ecfdf5] text-emerald-800 font-bold border border-emerald-200"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                <Layers className="w-4 h-4 text-gray-400" />
                <span>GeoJSON & Registry Roles</span>
              </button>
            </div>
          </div>

          {/* Bottom Sidebar Cards: Polygon L2 Verified + Sub-Registrar Badge */}
          <div className="space-y-3 pt-4 border-t border-gray-100">
            {/* Polygon Dark Status Card */}
            <div className="p-3.5 rounded-2xl bg-black text-white space-y-2 text-[11px] shadow-sm font-mono">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span className="text-xs font-bold text-gray-200">Polygon L2 Verified</span>
                </div>
                <span className="text-[10px] text-emerald-400 bg-emerald-950 px-1.5 py-0.5 rounded font-bold">
                  98.9 ms
                </span>
              </div>
              <div className="text-gray-400 text-[10px] space-y-0.5 border-t border-gray-800 pt-1.5">
                <div className="flex justify-between">
                  <span>Block Height:</span>
                  <span className="text-gray-200 font-bold">#18,924,183</span>
                </div>
                <div className="flex justify-between">
                  <span>Node Latency:</span>
                  <span className="text-gray-300">DGPS Peer PRG-082</span>
                </div>
                <div className="flex justify-between items-center text-[9px] text-gray-500 pt-1">
                  <span>Hash: 0x9b4f...a23e</span>
                  <Lock className="w-3 h-3 text-gray-400" />
                </div>
              </div>
            </div>

            {/* Sub-Registrar Division Badge */}
            <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2">
                <Building className="w-4 h-4 text-emerald-600" />
                <div>
                  <span className="font-bold text-gray-900 block text-[11px]">Sub-Registrar</span>
                  <span className="text-[10px] text-gray-500 block">Sadar & Karchhana Div</span>
                </div>
              </div>
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            </div>
          </div>
        </aside>

        {/* =================================================================== */}
        {/* CENTER MAIN WORKSPACE (Pending Title Deed Verifications)            */}
        {/* =================================================================== */}
        <main className="flex-1 p-4 sm:p-6 space-y-5 overflow-y-auto">
          {/* Top Officer Status Notice */}
          {adminStatusMessage && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-bold flex items-center justify-between shadow-2xs">
              <span>{adminStatusMessage}</span>
              <button
                onClick={() => setAdminStatusMessage("")}
                className="text-emerald-700 hover:text-emerald-900 text-xs underline"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Header Metadata Strip matching screenshot */}
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-gray-500 font-mono border-b border-gray-200 pb-3">
            <div className="flex flex-wrap items-center gap-4">
              <span>SUB-DIVISION: PRAYAGRAJ SADAR</span>
              <span className="hidden sm:inline text-gray-300">•</span>
              <span>CIRCLE RATE SCHEDULE: 2024-R2</span>
              <span className="hidden sm:inline text-gray-300">•</span>
              <span className="flex items-center space-x-1.5 text-emerald-700 font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>DGPS SYNC ACTIVE</span>
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-1 rounded bg-white border border-gray-200 text-gray-700 font-semibold text-[11px] shadow-2xs flex items-center space-x-1">
                <Radio className="w-3.5 h-3.5 text-emerald-600" />
                <span>GIS Node: PRG-082</span>
              </span>
              <span className="px-2.5 py-1 rounded bg-white border border-gray-200 text-purple-700 font-semibold text-[11px] shadow-2xs flex items-center space-x-1">
                <Cpu className="w-3.5 h-3.5 text-purple-600" />
                <span>DSC SmartCard Connected</span>
              </span>
            </div>
          </div>

          {/* Section Title */}
          <div className="flex items-center space-x-3">
            <h1 className="text-xl font-black text-gray-900 tracking-tight">
              Pending Title Deed Verifications
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-600 font-semibold">
              3 Dossiers Pending Sign-off
            </span>
          </div>

          {/* ================================================================= */}
          {/* APPLICATIONS QUEUE (Horizontal Cards Selector)                    */}
          {/* ================================================================= */}
          <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-xs space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center space-x-2 font-bold text-gray-800">
                <FileText className="w-4 h-4 text-emerald-600" />
                <span>Applications Queue</span>
                <span className="text-xs font-normal text-gray-500">3 Active</span>
              </div>

              {/* Filter Pills */}
              <div className="flex items-center space-x-1.5">
                <span className="px-2.5 py-1 rounded-lg bg-black text-white text-[11px] font-bold">
                  All (3)
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-gray-100 text-gray-600 text-[11px] font-medium hover:bg-gray-200 cursor-pointer">
                  Naini (2)
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-gray-100 text-gray-600 text-[11px] font-medium hover:bg-gray-200 cursor-pointer">
                  Civil Lines (1)
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-[11px] font-semibold flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                  <span>High Priority (1)</span>
                </span>
              </div>
            </div>

            {/* 3 Horizontal Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {queueApplications.map((app, idx) => {
                const isSelected = idx === selectedQueueIndex;
                return (
                  <div
                    key={app.id}
                    onClick={() => setSelectedQueueIndex(idx)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer relative ${
                      isSelected
                        ? "bg-[#f0fdf4] border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs"
                        : "bg-white border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    {isSelected && (
                      <span className="absolute -top-2 left-3 px-2 py-0.5 rounded bg-emerald-600 text-white text-[9px] font-extrabold uppercase tracking-wider flex items-center space-x-1 shadow-2xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                        <span>REVIEWING NOW</span>
                      </span>
                    )}

                    <div className="flex items-start justify-between">
                      <div>
                        <div className="text-sm font-black text-gray-900">
                          Khasra #{app.khasraNumber}
                        </div>
                        <div className="text-xs font-bold text-gray-800 mt-0.5 truncate">
                          {app.ownerName}
                        </div>
                        <div className="text-[11px] text-gray-500">
                          {app.village} • {app.areaSqFt.toLocaleString()} sq.ft
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-xs font-mono font-black text-gray-900 block">
                          {app.priceEth ? `${app.priceEth} ETH` : app.dutyPaid}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-gray-100 pt-2 mt-2 text-[10px] font-mono">
                      <span className="text-gray-500 font-bold">{app.valLabel}</span>
                      <span
                        className={`font-semibold flex items-center space-x-1 ${
                          app.statusColor === "emerald"
                            ? "text-emerald-700"
                            : app.statusColor === "blue"
                            ? "text-blue-700"
                            : "text-rose-700"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            app.statusColor === "emerald"
                              ? "bg-emerald-500"
                              : app.statusColor === "blue"
                              ? "bg-blue-500"
                              : "bg-rose-500"
                          }`}
                        ></span>
                        <span>{app.statusPill}</span>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ================================================================= */}
          {/* CADASTRAL PARTICULARS CARD (2x2 Grid)                             */}
          {/* ================================================================= */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-gray-100 pb-3">
              <div>
                <div className="flex items-center space-x-3">
                  <h2 className="text-base font-black text-gray-900 tracking-tight">
                    Cadastral Particulars: Khasra #{activeApp.khasraNumber}
                  </h2>
                  <span className="px-2 py-0.5 rounded bg-gray-100 border border-gray-200 text-gray-700 text-[10px] font-mono font-bold">
                    {activeApp.upPrgCode}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-gray-100 border border-gray-200 text-gray-700 text-[10px] font-mono font-bold">
                    Khata No: {activeApp.khataNumber}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold flex items-center space-x-1">
                    <Check className="w-3 h-3" />
                    <span>Clear Title • No Injunction</span>
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {activeApp.village}, Tehsil: {activeApp.tehsil}, District: {activeApp.district}, UP (PIN: {activeApp.pinCode})
                </p>
              </div>
            </div>

            {/* 2x2 Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {/* Box 1: Applicant Owner */}
              <div className="p-3.5 rounded-xl bg-gray-50/70 border border-gray-200 space-y-1">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                  APPLICANT OWNER
                </span>
                <div className="text-sm font-bold text-gray-900">{activeApp.ownerName}</div>
                <div className="flex items-center space-x-1.5 text-emerald-700 font-semibold text-[11px]">
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Verified Aadhaar & DigiLocker e-KYC</span>
                </div>
              </div>

              {/* Box 2: Owner Web3 Wallet */}
              <div className="p-3.5 rounded-xl bg-gray-50/70 border border-gray-200 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    OWNER WEB3 WALLET
                  </span>
                  <button
                    onClick={() => handleCopy(activeApp.ownerWallet, "wallet")}
                    className="text-gray-400 hover:text-gray-700"
                    title="Copy wallet address"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="text-xs font-mono font-bold text-gray-800 truncate">
                  {activeApp.ownerWallet}
                </div>
                <div className="text-[11px] text-gray-500 font-mono">
                  Polygon Verified Signature (EIP-712)
                </div>
              </div>

              {/* Box 3: Cadastral Land Area */}
              <div className="p-3.5 rounded-xl bg-gray-50/70 border border-gray-200 space-y-1">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                  CADASTRAL LAND AREA
                </span>
                <div className="text-base font-black text-gray-900">
                  {activeApp.areaSqFt.toLocaleString()} sq.ft
                </div>
                <div className="text-[11px] text-gray-500 font-mono">{activeApp.areaDetails}</div>
              </div>

              {/* Box 4: Declared Value & Circle Rate */}
              <div className="p-3.5 rounded-xl bg-gray-50/70 border border-gray-200 space-y-1">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                  DECLARED VALUE & CIRCLE RATE
                </span>
                <div className="text-base font-black text-gray-900">
                  ₹{activeApp.marketPrice.toLocaleString()} ({activeApp.priceEth} ETH)
                </div>
                <div className="text-[11px] text-gray-500 font-mono">
                  Circle Rate: ₹{activeApp.ratePerSqFt}/sq.ft • Min Eval: {activeApp.minEval}
                </div>
              </div>
            </div>

            {/* =============================================================== */}
            {/* SATELLITE HUD GIS MAP CONTAINER                                 */}
            {/* =============================================================== */}
            <div className="space-y-2">
              <div className="relative rounded-2xl overflow-hidden border border-gray-300 shadow-inner bg-slate-950">
                {/* Top HUD Controls over Map */}
                <div className="absolute top-2 left-3 right-3 z-20 flex items-center justify-between text-[11px] text-white font-mono pointer-events-none">
                  <div className="bg-black/80 backdrop-blur px-2.5 py-1 rounded-md border border-white/20 flex items-center space-x-1.5 pointer-events-auto">
                    <Compass className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Azimuth 0° (North)</span>
                  </div>

                  <div className="bg-black/80 backdrop-blur px-2.5 py-1 rounded-md border border-white/20 flex items-center space-x-2 pointer-events-auto">
                    <span>+</span>
                    <span>-</span>
                    <span className="text-gray-400">|</span>
                    <span>Scale: 25m</span>
                  </div>
                </div>

                {/* Leaflet Satellite Map */}
                <div ref={miniMapContainerRef} className="w-full h-64 z-10" />

                {/* Bottom HUD Coordinates Bar */}
                <div className="bg-black/90 border-t border-white/10 px-4 py-2.5 text-[11px] font-mono text-gray-300 flex flex-wrap items-center justify-between gap-2 z-20 relative">
                  <div>
                    <span className="text-gray-400">Corner A: </span>
                    <span className="text-white font-bold">{activeApp.cornerA}</span>
                    <span className="text-gray-500 mx-2">|</span>
                    <span className="text-gray-400">निर्देशांक: मानक जीपीएस (GPS WGS84)</span>
                  </div>

                  <div>
                    <span className="text-gray-400">Corner B: </span>
                    <span className="text-white font-bold">{activeApp.cornerB}</span>
                  </div>
                </div>

                {/* Ground Survey Strip */}
                <div className="bg-emerald-950 border-t border-emerald-800/60 px-4 py-2 text-xs font-mono text-emerald-300 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="truncate">
                      DGPS Ground Survey Verified by Lekhpal {activeApp.lekhpal} on {activeApp.surveyDate}
                    </span>
                  </div>
                  <span className="text-[10px] text-emerald-400/80">Sig: {activeApp.lekhpalSig}</span>
                </div>
              </div>
            </div>

            {/* =============================================================== */}
            {/* BOTTOM DECISION ACTIONS (Approve / Reject Buttons)              */}
            {/* =============================================================== */}
            <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-3 pt-2">
              <button
                onClick={handleRejectDeed}
                disabled={verifying}
                className="w-full sm:w-1/3 flex items-center justify-center space-x-2 py-3 px-4 rounded-xl border border-rose-300 bg-rose-50 hover:bg-rose-100 text-rose-800 font-bold text-xs transition-colors disabled:opacity-40"
              >
                <XCircle className="w-4 h-4" />
                <span>Reject / Raise Query</span>
              </button>

              <button
                onClick={handleApproveDeed}
                disabled={verifying}
                className="w-full sm:w-2/3 flex items-center justify-center space-x-2 py-3 px-4 rounded-xl bg-[#059669] hover:bg-[#047857] text-white font-black text-xs shadow-md transition-all active:scale-[0.99] disabled:opacity-40"
              >
                <CheckCircle className="w-4 h-4" />
                <span>
                  {verifying
                    ? "डिजिटल अभिलेख में दर्ज हो रहा है..."
                    : "विलेख अनुमोदित व डिजिटल प्रमाणित करें (Approve Deed)"}
                </span>
              </button>
            </div>
          </div>
        </main>

        {/* =================================================================== */}
        {/* RIGHT PANEL: TITLE DEED DOSSIER (Scanned Legal Instrument Viewer)   */}
        {/* =================================================================== */}
        <aside className="w-[430px] bg-white border-l border-gray-200 p-5 space-y-4 hidden lg:flex flex-col justify-between shrink-0 overflow-y-auto">
          <div className="space-y-4">
            {/* Header: Title Deed Dossier */}
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center space-x-2.5">
                <FileText className="w-5 h-5 text-gray-700" />
                <div>
                  <h3 className="text-xs font-black text-gray-900 uppercase tracking-tight">
                    Title Deed Dossier
                  </h3>
                  <p className="text-[10px] text-gray-500">
                    Scanned Legal Instrument & Encumbrance
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <span className="px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold flex items-center space-x-1">
                  <span>प्रमाणित दस्तावेज</span>
                </span>
                <span className="text-[11px] font-mono text-gray-400">1 / 4</span>
              </div>
            </div>

            {/* Permanent IPFS CID Box */}
            <div className="p-3 rounded-xl bg-gray-50 border border-gray-200 space-y-1">
              <div className="flex items-center justify-between text-[10px]">
                <span className="font-bold text-gray-400 uppercase">
                  डिजिटल दस्तावेज कोड
                </span>
                <a
                  href={`https://ipfs.io/ipfs/${activeApp.ipfsCid}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-600 hover:text-blue-800 font-bold inline-flex items-center space-x-1"
                >
                  <span>सुरक्षित दस्तावेज पोर्टल</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <div className="flex items-center justify-between font-mono text-xs text-gray-800 bg-white p-2 rounded-lg border border-gray-200">
                <span className="truncate pr-2">{activeApp.ipfsCid}</span>
                <button
                  onClick={() => handleCopy(activeApp.ipfsCid, "cid")}
                  className="text-gray-400 hover:text-gray-700 shrink-0"
                  title="Copy IPFS CID"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Certified Government Parchment / Paper Instrument Mockup */}
            <div className="p-5 rounded-2xl bg-[#fffdfa] border border-[#e8e2d5] font-serif text-gray-800 space-y-3.5 shadow-2xs text-xs leading-relaxed">
              {/* Seal & Heading */}
              <div className="text-center border-b border-[#e8e2d5] pb-3 space-y-1">
                <div className="w-8 h-8 rounded-full bg-slate-900 text-white mx-auto flex items-center justify-center font-bold text-xs">
                  🏛️
                </div>
                <h4 className="font-black text-xs uppercase tracking-wide text-gray-900">
                  Government of Uttar Pradesh
                </h4>
                <p className="text-[10px] text-gray-500 font-sans">
                  Sub-Registrar Office Sadar, District Prayagraj • Registry Verification Dossier
                </p>
              </div>

              {/* Certificate No & Stamp Duty Paid */}
              <div className="grid grid-cols-2 gap-2 text-[10px] font-sans border-b border-[#e8e2d5] pb-2.5">
                <div>
                  <span className="text-gray-400 block font-bold">Cert No:</span>
                  <span className="font-mono font-bold text-gray-800">{activeApp.certNo}</span>
                </div>
                <div className="text-right">
                  <span className="text-gray-400 block font-bold">Duty Paid:</span>
                  <span className="font-mono font-bold text-emerald-800">{activeApp.dutyPaid}</span>
                </div>
              </div>

              {/* Indenture Text */}
              <p className="italic text-[11px] text-gray-700 bg-amber-50/50 p-2.5 rounded-lg border border-amber-100/80">
                "THIS INDENTURE OF ABSOLUTE SALE executed on this 12th day of October, 2024 between Sri {activeApp.ownerName}, S/o Late K.P. Sharma (Vendor) AND Sri Alok Nath Tripathi (Vendee)..."
              </p>

              {/* Cadastral Coordinates & Abuttals */}
              <div className="space-y-1 text-[10px] font-sans">
                <span className="font-bold text-gray-700 uppercase tracking-wider block">
                  Cadastral Coordinates & Abuttals:
                </span>
                <div className="grid grid-cols-2 gap-1.5 text-gray-600 bg-gray-50/80 p-2 rounded-lg border border-gray-200">
                  <div>• North: {activeApp.abuttals.north}</div>
                  <div>• South: {activeApp.abuttals.south}</div>
                  <div>• East: {activeApp.abuttals.east}</div>
                  <div>• West: {activeApp.abuttals.west}</div>
                </div>
              </div>

              {/* Encumbrance Warrant */}
              <p className="text-[10px] text-gray-600 leading-tight">
                <strong>Encumbrance Warrant:</strong> The Vendor certifies absolute unencumbered ownership of Plot #{activeApp.khasraNumber}. Automated cross-index query completed with UP Revenue Land Records Portal & High Court of Judicature at Allahabad registry API returns <strong className="text-emerald-700">Zero Active Lis Pendens</strong>.
              </p>

              {/* Cryptographic Deed Hash & Digital Stamp */}
              <div className="flex items-center justify-between border-t border-[#e8e2d5] pt-2 text-[10px] font-sans">
                <div>
                  <span className="text-gray-400 block font-mono text-[9px]">CRYPTOGRAPHIC DEED HASH</span>
                  <span className="font-mono font-bold text-gray-800">{activeApp.deedHash}</span>
                </div>
                <div className="px-2 py-1 rounded bg-emerald-50 border border-emerald-300 text-emerald-800 text-[10px] font-bold text-center">
                  UP-REV DIGITAL SEAL VERIFIED
                </div>
              </div>

              {/* Verified Execution Signatures */}
              <div className="border-t border-[#e8e2d5] pt-2 space-y-1 font-sans text-[10px]">
                <span className="text-gray-400 uppercase font-bold block text-[9px]">
                  VERIFIED EXECUTION SIGNATURES:
                </span>
                <div className="grid grid-cols-3 gap-1 text-center">
                  <div className="p-1 rounded bg-gray-50 border border-gray-200">
                    <span className="text-emerald-600 font-bold block">✓ Signed</span>
                    <span className="text-gray-800 font-medium">R. Sharma</span>
                    <span className="text-[8px] text-gray-400 block">(Vendor e-Sign)</span>
                  </div>
                  <div className="p-1 rounded bg-gray-50 border border-gray-200">
                    <span className="text-emerald-600 font-bold block">✓ Attested</span>
                    <span className="text-gray-800 font-medium">R. Tiwari</span>
                    <span className="text-[8px] text-gray-400 block">(Witness 1)</span>
                  </div>
                  <div className="p-1 rounded bg-gray-50 border border-gray-200">
                    <span className="text-emerald-600 font-bold block">✓ Attested</span>
                    <span className="text-gray-800 font-medium">S. Devi</span>
                    <span className="text-[8px] text-gray-400 block">(Witness 2)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Document Action Links */}
            <div className="flex items-center justify-between text-xs font-semibold text-gray-600 px-1">
              <button
                onClick={handleDownloadDossier}
                className="hover:text-emerald-700 flex items-center space-x-1 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Dossier (PDF)</span>
              </button>

              <button
                onClick={() => handleCopy(JSON.stringify(activeApp, null, 2), "json")}
                className="hover:text-blue-700 flex items-center space-x-1 transition-colors"
              >
                <Code className="w-3.5 h-3.5" />
                <span>Raw JSON</span>
              </button>
            </div>
          </div>

          {/* Bottom Smart Contract Ready Card */}
          <div className="p-3 rounded-2xl bg-gray-50 border border-gray-200 flex items-center justify-between text-xs font-mono mt-4">
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 rounded-lg bg-black text-white flex items-center justify-center">
                <Cpu className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <div className="font-bold text-gray-900 text-[11px]">डिजिटल सत्यापन हेतु तैयार</div>
                <div className="text-[10px] text-gray-500">UPCadastreLandDeed.sol • v2.4.1</div>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] text-emerald-700 font-bold block">Gas: ~0.004 MATIC</span>
              <span className="text-[10px] text-gray-400">Polygon Mainnet #137</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
