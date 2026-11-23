import React, { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import {
  QrCode,
  Search,
  CheckCircle,
  AlertTriangle,
  ShieldCheck,
  FileText,
  Printer,
  MapPin,
  ExternalLink,
  Clock,
  Compass,
  ArrowRight,
  User,
  Scale,
  Sparkles,
  Layers,
} from "lucide-react";
import { useLanguage } from "../context/LanguageContext";

export default function VerifyQR({ onInspectOnMap }) {
  const { language } = useLanguage();
  const [searchInput, setSearchInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [verifiedResult, setVerifiedResult] = useState(null);
  const [searched, setSearched] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

  const handleVerifyLookup = async (e) => {
    e?.preventDefault();
    const query = searchInput.trim();
    if (!query) {
      setErrorMessage("कृपया प्रमाण पत्र संख्या, गाटा संख्या अथवा गाँव का नाम दर्ज करें।");
      return;
    }

    setLoading(true);
    setErrorMessage("");
    setSearched(true);

    try {
      const res = await fetch(`${API_URL}/api/registry/verify/${encodeURIComponent(query)}`);
      const data = await res.json();

      if (data.success && data.record) {
        setVerifiedResult(data);
      } else {
        // Fallback search with query params
        const res2 = await fetch(`${API_URL}/api/registry/verify?khasra=${encodeURIComponent(query)}&village=${encodeURIComponent(query)}`);
        const data2 = await res2.json();
        if (data2.success && data2.record) {
          setVerifiedResult(data2);
        } else {
          setVerifiedResult(null);
          setErrorMessage(data2.message || "इस विवरण का कोई प्रमाणित भूलेख नहीं मिला।");
        }
      }
    } catch (err) {
      console.warn("Verify error:", err);
      setVerifiedResult(null);
      setErrorMessage("सर्वर से सत्यापन करने में असमर्थ। कृपया पुनः प्रयास करें।");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLookup = (certId) => {
    setSearchInput(certId);
    setLoading(true);
    setErrorMessage("");
    setSearched(true);

    fetch(`${API_URL}/api/registry/verify/${encodeURIComponent(certId)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.record) {
          setVerifiedResult(data);
        } else {
          setVerifiedResult(null);
          setErrorMessage("प्रमाण पत्र नहीं मिला।");
        }
      })
      .catch(() => {
        setVerifiedResult(null);
        setErrorMessage("सर्वर त्रुटि।");
      })
      .finally(() => setLoading(false));
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 text-slate-900 pb-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-300">
            <ShieldCheck className="w-4 h-4 text-emerald-700" />
            <span>राजस्व परिषद उत्तर प्रदेश • डिजिटल भूलेख एवं QR सत्यापन</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            जमीन व प्रमाण पत्र सत्यापन (Verify Land & QR)
          </h1>
          <p className="text-xs sm:text-sm text-slate-600">
            भूखंड प्रमाण पत्र संख्या (Certificate ID) अथवा गाटा संख्या दर्ज करके वास्तविक मालिक, चारों मेड़ों की नाप, एवं संपूर्ण मालिकाना इतिहास की तत्काल प्रामाणिकता जांचें।
          </p>
        </div>

        {/* Search Box */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm max-w-3xl mx-auto space-y-3">
          <form onSubmit={handleVerifyLookup} className="flex flex-col sm:flex-row items-center gap-2">
            <div className="relative flex-1 w-full">
              <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="प्रमाण पत्र सं. (उदा. UP-REV-2026-CHTR-104) या गाटा सं. दर्ज करें..."
                className="w-full pl-11 pr-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-sm shadow-sm transition-transform active:scale-95 cursor-pointer disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>सत्यापित हो रहा है...</span>
                </>
              ) : (
                <>
                  <QrCode className="w-4 h-4" />
                  <span>जांचें (Verify Title)</span>
                </>
              )}
            </button>
          </form>

          {/* Quick Click Badges */}
          <div className="flex flex-wrap items-center gap-2 text-xs pt-1">
            <span className="text-slate-400 font-bold">त्वरित जांच:</span>
            <button
              type="button"
              onClick={() => handleQuickLookup("UP-REV-2026-CHIT-104")}
              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-emerald-100 text-slate-700 hover:text-emerald-900 border border-slate-200 font-mono font-semibold transition-colors cursor-pointer"
            >
              UP-REV-2026-CHIT-104 (चित्रकूट)
            </button>
            <button
              type="button"
              onClick={() => handleQuickLookup("UP-REV-2026-BAND-208")}
              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-emerald-100 text-slate-700 hover:text-emerald-900 border border-slate-200 font-mono font-semibold transition-colors cursor-pointer"
            >
              UP-REV-2026-BAND-208 (बांदा)
            </button>
            <button
              type="button"
              onClick={() => handleQuickLookup("UP-REV-2026-PRAY-412")}
              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-emerald-100 text-slate-700 hover:text-emerald-900 border border-slate-200 font-mono font-semibold transition-colors cursor-pointer"
            >
              UP-REV-2026-PRAY-412 (प्रयागराज)
            </button>
          </div>
        </div>

        {/* Error State */}
        {errorMessage && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm font-semibold max-w-3xl mx-auto flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 flex-shrink-0 text-rose-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Verification Card Result */}
        {verifiedResult && (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-lg overflow-hidden max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
            {/* Top Verification Status Banner */}
            <div
              className={`p-6 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                verifiedResult.statusBadge === "VERIFIED_CLEAN"
                  ? "bg-gradient-to-r from-emerald-800 to-teal-800"
                  : "bg-gradient-to-r from-rose-800 to-amber-800"
              }`}
            >
              <div className="flex items-center space-x-3.5">
                <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 flex-shrink-0">
                  <CheckCircle className="w-7 h-7 text-emerald-300" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs uppercase font-extrabold tracking-wider bg-white/20 px-2 py-0.5 rounded-full">
                      राजस्व डिजिटल अभिलेख
                    </span>
                    <span className="text-xs font-mono font-bold text-emerald-200">
                      {verifiedResult.certificateId}
                    </span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black mt-0.5">
                    {verifiedResult.statusTextHindi}
                  </h2>
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-md p-2 rounded-xl border border-white/20 flex-shrink-0 hidden sm:block">
                <QRCodeSVG value={verifiedResult.record?.qrVerificationUrl || `https://bhumichain.up.gov.in/verify/${verifiedResult.certificateId}`} size={64} level="M" />
              </div>
            </div>

            {/* Content Details */}
            <div className="p-6 space-y-6 pt-0">
              {/* Administrative Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">जनपद (District)</span>
                  <span className="font-extrabold text-slate-900">{verifiedResult.record?.district}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">तहसील / विकास खंड</span>
                  <span className="font-extrabold text-slate-900">
                    {verifiedResult.record?.tehsil} • {verifiedResult.record?.block}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">ग्राम (Village)</span>
                  <span className="font-extrabold text-slate-900">{verifiedResult.record?.village}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">6-अंकीय पिनकोड</span>
                  <span className="font-black text-emerald-800 font-mono">
                    {verifiedResult.pincode} ({verifiedResult.postOfficeName})
                  </span>
                </div>
              </div>

              {/* Current Owner Details */}
              <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 space-y-2">
                <div className="flex items-center justify-between border-b border-emerald-200 pb-2">
                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4 text-emerald-700" />
                    <span className="font-black text-sm text-emerald-950">
                      वर्तमान प्रमाणित काश्तकार (Current Verified Owner)
                    </span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-200 text-emerald-900 font-bold text-[10px]">
                    100% एकल स्वामित्व
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
                  <div>
                    <span className="text-[10px] text-slate-500 block">काश्तकार का नाम:</span>
                    <span className="font-black text-slate-900 text-sm">
                      {verifiedResult.currentOwner?.ownerName}
                    </span>
                    <span className="text-[11px] text-slate-600 block mt-0.5">
                      {verifiedResult.currentOwner?.fatherName}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">गाटा व खाता संख्या:</span>
                    <span className="font-bold text-slate-900 font-mono">
                      गाटा #{verifiedResult.currentOwner?.khasraNumber} (खाता सं. {verifiedResult.currentOwner?.khataNumber})
                    </span>
                    <span className="text-[11px] text-slate-600 block mt-0.5">
                      फसली वर्ष: {verifiedResult.currentOwner?.startFasli}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">अंतरण का स्वरूप (Transfer Mode):</span>
                    <span className="font-bold text-slate-900">
                      {verifiedResult.currentOwner?.transferMode}
                    </span>
                    <span className="text-[10px] text-slate-500 block mt-0.5 font-mono">
                      {verifiedResult.currentOwner?.mutationOrderNumber}
                    </span>
                  </div>
                </div>
              </div>

              {/* Area & Four Sides */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Area Metrics */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                  <span className="font-bold text-slate-900 block border-b border-slate-200 pb-1.5">
                    रकबा व क्षेत्रफल विवरण (Area Breakdown)
                  </span>
                  <div className="grid grid-cols-2 gap-2 pt-1 text-center">
                    <div className="p-2 rounded-xl bg-white border border-slate-200">
                      <span className="text-[10px] text-slate-400 block">पक्का बीघा</span>
                      <span className="text-base font-black text-slate-900">
                        {verifiedResult.area?.pakkaBigha} बीघा
                      </span>
                    </div>
                    <div className="p-2 rounded-xl bg-white border border-slate-200">
                      <span className="text-[10px] text-slate-400 block">बिस्वा</span>
                      <span className="text-base font-black text-slate-900">
                        {verifiedResult.area?.biswa} बिस्वा
                      </span>
                    </div>
                    <div className="p-2 rounded-xl bg-white border border-slate-200">
                      <span className="text-[10px] text-slate-400 block">वर्ग फीट</span>
                      <span className="text-base font-black text-slate-900 font-mono">
                        {verifiedResult.area?.sqFt?.toLocaleString("en-IN")}
                      </span>
                    </div>
                    <div className="p-2 rounded-xl bg-white border border-slate-200">
                      <span className="text-[10px] text-slate-400 block">हेक्टेयर (Revenue Ha)</span>
                      <span className="text-base font-black text-slate-900 font-mono">
                        {verifiedResult.area?.hectare} हे.
                      </span>
                    </div>
                  </div>
                </div>

                {/* 4 Sides Measurements */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                    <span className="font-bold text-slate-900 flex items-center space-x-1.5">
                      <Compass className="w-3.5 h-3.5 text-emerald-700" />
                      <span>चारों मेड़ों की नाप (Boundary Dimensions)</span>
                    </span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">
                      DGPS फीता नाप
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div className="p-2 rounded-xl bg-white border border-slate-200 text-center">
                      <span className="text-[10px] text-slate-400 block">उत्तर (North)</span>
                      <span className="font-black text-slate-900 font-mono text-sm">
                        {verifiedResult.fourSides?.north?.feet} फ़ीट
                      </span>
                      <span className="text-[9.5px] text-slate-400 block">({verifiedResult.fourSides?.north?.meters} m)</span>
                    </div>
                    <div className="p-2 rounded-xl bg-white border border-slate-200 text-center">
                      <span className="text-[10px] text-slate-400 block">दक्षिण (South)</span>
                      <span className="font-black text-slate-900 font-mono text-sm">
                        {verifiedResult.fourSides?.south?.feet} फ़ीट
                      </span>
                      <span className="text-[9.5px] text-slate-400 block">({verifiedResult.fourSides?.south?.meters} m)</span>
                    </div>
                    <div className="p-2 rounded-xl bg-white border border-slate-200 text-center">
                      <span className="text-[10px] text-slate-400 block">पूर्व (East)</span>
                      <span className="font-black text-slate-900 font-mono text-sm">
                        {verifiedResult.fourSides?.east?.feet} फ़ीट
                      </span>
                      <span className="text-[9.5px] text-slate-400 block">({verifiedResult.fourSides?.east?.meters} m)</span>
                    </div>
                    <div className="p-2 rounded-xl bg-white border border-slate-200 text-center">
                      <span className="text-[10px] text-slate-400 block">पश्चिम (West)</span>
                      <span className="font-black text-slate-900 font-mono text-sm">
                        {verifiedResult.fourSides?.west?.feet} फ़ीट
                      </span>
                      <span className="text-[9.5px] text-slate-400 block">({verifiedResult.fourSides?.west?.meters} m)</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* CHRONOLOGICAL PAST OWNERS TIMELINE */}
              <div className="p-5 rounded-2xl bg-amber-50/50 border border-amber-200 space-y-3">
                <div className="flex items-center justify-between border-b border-amber-200 pb-2">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-amber-800" />
                    <h3 className="font-black text-sm text-amber-950">
                      मालिकाना इतिहास — पहले किसकी ज़मीन थी (Past Ownership Chain)
                    </h3>
                  </div>
                  <span className="text-[10px] bg-amber-200 text-amber-900 px-2.5 py-0.5 rounded-full font-bold">
                    1995 से 2026 तक प्रमाणित
                  </span>
                </div>

                <div className="space-y-3 pt-1">
                  {/* Active Owner Card in Timeline */}
                  <div className="flex items-start space-x-3 text-xs bg-white p-3 rounded-xl border-l-4 border-emerald-600 shadow-2xs">
                    <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5">
                      ✓
                    </div>
                    <div className="flex-1 space-y-0.5">
                      <div className="flex items-center justify-between">
                        <span className="font-black text-slate-900 text-sm">
                          {verifiedResult.currentOwner?.ownerName}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                          वर्तमान मालिक (2018 - Present)
                        </span>
                      </div>
                      <p className="text-slate-600">
                        {verifiedResult.currentOwner?.fatherName} • {verifiedResult.currentOwner?.transferMode}
                      </p>
                      <p className="text-[10px] text-slate-500 font-mono">
                        {verifiedResult.currentOwner?.mutationOrderNumber}
                      </p>
                    </div>
                  </div>

                  {/* Past Owners Loop */}
                  {verifiedResult.pastOwners && verifiedResult.pastOwners.map((po, idx) => (
                    <div key={idx} className="flex items-start space-x-3 text-xs bg-white p-3 rounded-xl border-l-4 border-amber-500 shadow-2xs">
                      <div className="w-7 h-7 rounded-full bg-amber-100 text-amber-900 flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5">
                        {idx + 1}
                      </div>
                      <div className="flex-1 space-y-0.5">
                        <div className="flex items-center justify-between">
                          <span className="font-black text-slate-900 text-sm">
                            {po.ownerName}
                          </span>
                          <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 font-bold text-[10px]">
                            {po.tenurePeriod}
                          </span>
                        </div>
                        <p className="text-slate-600">
                          {po.relation} • {po.transferMode}
                        </p>
                        <p className="text-[10px] text-slate-500 font-mono">
                          {po.orderNumber} ({po.orderDate})
                        </p>
                        <p className="text-[10px] text-emerald-800 italic">
                          {po.remarks}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-200">
                <button
                  onClick={() => window.print()}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center space-x-2 transition-colors cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>प्रमाण पत्र प्रिंट / डाउनलोड करें (Print PDF)</span>
                </button>

                <button
                  onClick={() => onInspectOnMap && onInspectOnMap(verifiedResult.record)}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs flex items-center justify-center space-x-2 transition-colors cursor-pointer"
                >
                  <Compass className="w-4 h-4" />
                  <span>नक्शे पर खेत देखें (Inspect On Map)</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
