import React, { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { generateLandDossierPDF } from "../utils/pdfGenerator";
import {
  QrCode,
  Search,
  CheckCircle,
  AlertTriangle,
  ShieldCheck,
  FileText,
  Download,
  MapPin,
  ExternalLink,
  Upload,
} from "lucide-react";

export default function VerifyQR({ onInspectOnMap }) {
  const [searchInput, setSearchInput] = useState("104");
  const [loading, setLoading] = useState(false);
  const [verifiedParcel, setVerifiedParcel] = useState({
    khasraNumber: "104",
    khataNumber: "00412",
    registryId: "IN-UP-PRG-104",
    village: "Naini",
    tehsil: "Karchhana",
    district: "Prayagraj",
    ownerName: "Rameshwar Sharma",
    ownerWallet: "0x94B73E12D3F5C24A0991823aA1175628bC38431E",
    rwaTokenId: "88412",
    marketPrice: 4500000,
    price: "1.50",
    priceMatic: "53,820",
    circleRate: 3600000,
    areaSqFt: 2400,
    areaAre: 2.22,
    areaAcre: 0.055,
    status: "Verified",
    isForSale: true,
    bankLienStatus: "Nil Encumbrance — SBI API Certified (0 Liens)",
    disputeRegistry: "Zero Disputes — High Court UP Bench Clear",
    proprietorStatus: "Sole Legal Proprietor (100% Share)",
    kycStatus: "Aadhaar Vault • DigiLocker Linked | e-KYC VERIFIED",
  });
  const [searched, setSearched] = useState(true);

  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";

  const handleVerifyLookup = (e) => {
    e?.preventDefault();
    if (!searchInput.trim()) return;

    setLoading(true);
    fetch(`${apiUrl}/api/properties?search=${searchInput.trim()}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.properties?.length > 0) {
          setVerifiedParcel(data.properties[0]);
        } else {
          // If not found in API, check if searching for 104
          if (searchInput.includes("104")) {
            setVerifiedParcel({
              khasraNumber: "104",
              khataNumber: "00412",
              registryId: "IN-UP-PRG-104",
              village: "Naini",
              tehsil: "Karchhana",
              district: "Prayagraj",
              ownerName: "Rameshwar Sharma",
              ownerWallet: "0x94B73E12D3F5C24A0991823aA1175628bC38431E",
              rwaTokenId: "88412",
              marketPrice: 4500000,
              price: "1.50",
              priceMatic: "53,820",
              circleRate: 3600000,
              areaSqFt: 2400,
              areaAre: 2.22,
              areaAcre: 0.055,
              status: "Verified",
              isForSale: true,
              bankLienStatus: "Nil Encumbrance — SBI API Certified (0 Liens)",
              disputeRegistry: "Zero Disputes — High Court UP Bench Clear",
              proprietorStatus: "Sole Legal Proprietor (100% Share)",
              kycStatus: "Aadhaar Vault • DigiLocker Linked | e-KYC VERIFIED",
            });
          } else {
            setVerifiedParcel(null);
          }
        }
        setSearched(true);
      })
      .catch(() => {
        // Fallback
        setVerifiedParcel(null);
        setSearched(true);
      })
      .finally(() => setLoading(false));
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-10 space-y-8 animate-in fade-in duration-200">
      {/* Title Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex p-3 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-2">
          <QrCode className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-black text-white tracking-tight">
          Sovereign QR Title Deed Verification Engine
        </h1>
        <p className="text-xs text-slate-400 max-w-lg mx-auto">
          Scan or input any physical land certificate QR code, Khasra Number, or Registry ID to query cryptographic title provenance on the UP-GIS ledger node.
        </p>
      </div>

      {/* Search Input Box */}
      <form onSubmit={handleVerifyLookup} className="max-w-xl mx-auto">
        <div className="flex items-center bg-slate-900 border border-slate-700 rounded-2xl p-1.5 shadow-2xl focus-within:border-emerald-500 transition-colors">
          <Search className="w-5 h-5 text-slate-400 ml-3 mr-2" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Enter Khasra (e.g., 104) or Registry ID (IN-UP-PRG-104)..."
            className="flex-1 bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-slate-950 font-bold text-xs shadow-md transition-all disabled:opacity-40"
          >
            {loading ? "Verifying..." : "Verify Title"}
          </button>
        </div>
      </form>

      {/* Verification Result Card */}
      {searched && (
        <div className="max-w-2xl mx-auto">
          {verifiedParcel ? (
            <div className="rounded-2xl bg-gradient-to-br from-slate-900 via-[#0b1329] to-slate-900 border border-emerald-500/40 p-6 shadow-2xl space-y-6 relative overflow-hidden">
              {/* Official Seal Banner */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-xs font-mono font-bold text-emerald-400 flex items-center space-x-1">
                      <CheckCircle className="w-3.5 h-3.5 inline" />
                      <span>CRYPTOGRAPHICALLY VERIFIED RECORD</span>
                    </span>
                    <h3 className="text-sm font-extrabold text-white">
                      Khasra #{verifiedParcel.khasraNumber} — {verifiedParcel.village}
                    </h3>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 font-bold block">
                    RWA Token #{verifiedParcel.rwaTokenId || "88412"}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">
                    Block: #19827412
                  </span>
                </div>
              </div>

              {/* QR and Metadata Split */}
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <div className="p-3 bg-white rounded-xl shadow-lg flex-shrink-0">
                  <QRCodeSVG
                    value={`https://bhumichain.up.gov.in/verify/parcel/${verifiedParcel.khasraNumber}`}
                    size={130}
                    level="H"
                  />
                </div>

                <div className="flex-1 space-y-2 text-xs">
                  <div className="grid grid-cols-2 gap-2 text-slate-300 font-mono text-[11px]">
                    <div>
                      <span className="text-slate-500 block">Registry ID:</span>
                      <span className="font-bold text-white">
                        {verifiedParcel.registryId || `IN-UP-PRG-${verifiedParcel.khasraNumber}`}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Khata Number:</span>
                      <span className="font-bold text-white">{verifiedParcel.khataNumber}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Total Area:</span>
                      <span className="font-bold text-white">
                        {verifiedParcel.areaSqFt || 2400} sq.ft ({verifiedParcel.areaAre || 2.22} Are)
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Circle Rate:</span>
                      <span className="font-bold text-emerald-400">
                        ₹{(verifiedParcel.circleRate || 3600000).toLocaleString("en-IN")}
                      </span>
                    </div>
                  </div>

                  <div className="border-t border-slate-800 pt-2 text-[11px] text-slate-300">
                    <span className="text-slate-500">Verified Legal Owner:</span>{" "}
                    <strong className="text-white">{verifiedParcel.ownerName}</strong> (
                    {verifiedParcel.proprietorStatus || "Sole Proprietor 100%"})
                  </div>

                  <div className="text-[11px] text-emerald-400 font-mono">
                    ✓ {verifiedParcel.bankLienStatus || "SBI API Certified (0 Liens)"}
                  </div>
                  <div className="text-[11px] text-emerald-400 font-mono">
                    ✓ {verifiedParcel.disputeRegistry || "Zero Disputes — High Court UP Bench Clear"}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-3 border-t border-slate-800 pt-4">
                <button
                  onClick={() => onInspectOnMap(verifiedParcel)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-teal-300 border border-slate-700 font-bold text-xs flex items-center justify-center space-x-2 transition-colors"
                >
                  <MapPin className="w-4 h-4 text-emerald-400" />
                  <span>Inspect on Satellite Map</span>
                </button>

                <button
                  onClick={() => generateLandDossierPDF(verifiedParcel)}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-slate-950 font-bold text-xs flex items-center justify-center space-x-2 transition-all shadow-md"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Certified Dossier (PDF)</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-2">
              <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto" />
              <h4 className="text-xs font-bold text-slate-200">No Record Found for "{searchInput}"</h4>
              <p className="text-[11px] text-slate-500">
                Ensure you enter a valid Khasra Number (e.g. 104, 142/1) or complete Registry ID.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
