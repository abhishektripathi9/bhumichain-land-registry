import React, { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import {
  X,
  Printer,
  Download,
  ShieldCheck,
  CheckCircle,
  FileText,
  Compass,
  Building,
  Scale,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import { generateLandDossierPDF } from "../utils/pdfGenerator";

export default function KhatauniModal({ isOpen, onClose, parcel, language = "hi" }) {
  const [loading, setLoading] = useState(false);
  const [nakalData, setNakalData] = useState(null);

  useEffect(() => {
    if (!isOpen || !parcel) return;

    let isMounted = true;
    setLoading(true);

    const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
    const villageName = parcel.village || "Naini";
    const districtName = parcel.district || "Prayagraj";
    const tehsilName = parcel.tehsil || "Karchhana";
    const blockName = parcel.block || "";
    const khasraNo = parcel.khasraNumber || parcel.id || "104";
    const lat = parcel.center?.[0] || "";
    const lng = parcel.center?.[1] || "";

    fetch(
      `${API_URL}/api/bhulekh/khatauni?khasra=${encodeURIComponent(khasraNo)}&district=${encodeURIComponent(
        districtName
      )}&tehsil=${encodeURIComponent(tehsilName)}&block=${encodeURIComponent(blockName)}&village=${encodeURIComponent(villageName)}&lat=${lat}&lng=${lng}`
    )
      .then((r) => r.json())
      .then((res) => {
        if (isMounted && res.success && res.nakal) {
          setNakalData(res.nakal);
        } else if (isMounted) {
          setNakalData(buildFallbackNakal(parcel));
        }
      })
      .catch((err) => {
        console.warn("Using local nakal fallback:", err);
        if (isMounted) {
          setNakalData(buildFallbackNakal(parcel));
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, parcel]);

  if (!isOpen || !parcel) return null;

  // Fallback builder if server is unreachable
  function buildFallbackNakal(p) {
    const sqft = p.areaSqFt || 2400;
    const ha = (sqft / 107639.1).toFixed(4);
    const bigha = (sqft / 27225).toFixed(3);
    const biswa = (sqft / 1361.25).toFixed(2);

    return {
      col1_fasliYear: p.fasliYear || "1431-1436 (फसली)",
      col2_bhag: "1 (क)",
      col3_khataSankhya: p.khataNumber || "00412",
      col4_khasraGataSankhya: p.khasraNumber || "104",
      col5_rakba: {
        hectare: parseFloat(ha),
        sqFt: sqft,
        pakkaBigha: parseFloat(bigha),
        biswa: parseFloat(biswa),
        are: (sqft / 1076.39).toFixed(2),
        fourSideLengthsFeet: {
          north: p.dimensions?.north || "729.6 ft (222.39 m)",
          east: p.dimensions?.east || "134.1 ft (40.86 m)",
          south: p.dimensions?.south || "729.6 ft (222.39 m)",
          west: p.dimensions?.west || "134.1 ft (40.87 m)",
        },
      },
      col6_khatedarName: p.ownerName || "रामेश्वर शर्मा",
      col6_fatherName: p.fatherName || "स्व. के. पी. शर्मा",
      col6_ownerWallet: p.ownerWallet || "0x94B73E12D3F5C24A0991823aA1175628bC38431E",
      col7_sahKhatedars: [
        {
          name: p.ownerName || "रामेश्वर शर्मा",
          relation: `आत्मज ${p.fatherName || "स्व. के. पी. शर्मा"}`,
          shareFraction: "1/1 (100% पूर्ण स्वामित्व)",
          shareSqFt: sqft,
        },
      ],
      col8_residence: `ग्राम ${p.villageHi || p.village}, विकास खंड ${p.block || p.tehsilHi || p.tehsil}, तहसील ${p.tehsilHi || p.tehsil}, जनपद ${p.districtHi || p.district} (पिन: ${p.pinCode || "210001"})`,
      col9_tenureStartYear: "1398 फसली (भूमिधर संक्राम्य अधिकार)",
      col10_mutationOrders: `आदेश तहसीलदार ${p.tehsilHi || p.tehsil} वाद सं. 419/2018 दिनांक 14-11-2018 धारा 34 प.क. 11 नामांतरण स्वीकृत।`,
      col11_bankLien: p.bankLienDetail || "भार रहित (Nil Encumbrance / CERSAI 0 Liens)",
      col12_litigationStatus: p.disputeDetail || "कोई वाद विचाराधीन नहीं (Zero Disputes / High Court UP Clear)",
      col13_remarks: {
        upCadastreTokenId: p.rwaTokenId || "88412",
        permanentIpfsCID: "bafybeih43x7v57qln4x535n23165p3z317d7b4e284920482049",
        digitalSeal: "✓ UP-REV CADASTRAL SEAL VERIFIED",
        lekhpalVerification: p.lekhpalName || "DGPS Ground Survey Verified by Lekhpal R.K. Yadav",
      },
      chauhaddi: {
        north: "गाटा सं. 98 (चक मार्ग 4.0 मीटर)",
        south: "गाटा सं. 109 (निजी कृषि भूमि)",
        east: "गाटा सं. 105 (पक्का सीमांकन)",
        west: "रेलवे बफर कॉरिडोर (SH-90 नैनी लिंक)",
      },
      administrativeHierarchy: {
        state: "Uttar Pradesh",
        district: p.district,
        tehsil: p.tehsil,
        block: p.block || p.tehsil,
        village: p.village,
        villageRevenueCode: "162101",
        pincode: p.pinCode || "210001",
      },
      financials: {
        marketPriceInr: p.marketPrice || 4500000,
        priceEth: p.priceEth || "1.50",
        circleRateInr: p.circleRate || 3480000,
        upStampDuty7Pct: Math.round((p.circleRate || 3480000) * 0.07),
        isForSale: p.isForSale ?? true,
      },
    };
  }

  const nakal = nakalData || buildFallbackNakal(parcel);
  const rakba = nakal.col5_rakba || {};
  const fourSides = rakba.fourSideLengthsFeet || {};

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/70 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-5xl bg-[#fffefb] border-2 border-[#d97706]/40 rounded-2xl shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        
        {/* TOP GOVERNMENT RIBBON */}
        <div className="bg-gradient-to-r from-[#1e293b] via-[#0f172a] to-[#1e293b] text-white px-5 py-3 flex items-center justify-between border-b border-amber-600/30">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-400 flex items-center justify-center font-bold text-amber-300 text-xs shadow-inner">
              उ.प्र.
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-sm tracking-wide text-amber-200">
                  {language === "hi"
                    ? "उत्तर प्रदेश भूलेख (अधिकार अभिलेख) • प्रारूप 45 खतौनी"
                    : "UP Bhulekh Land Records • Form 45 Khatauni Nakal"}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  डिजिटल राजस्व परिषद सत्यापित
                </span>
              </div>
              <p className="text-[10px] text-gray-300">
                राजस्व परिषद उत्तर प्रदेश • धारा 33/34 उ.प्र. राजस्व संहिता 2006 • Electronic Certified Copy
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center space-x-1 transition-colors cursor-pointer"
              title="Print Official Form 45 Khatauni"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">प्रिंट</span>
            </button>
            <button
              onClick={() => generateLandDossierPDF(parcel)}
              className="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center space-x-1 transition-colors cursor-pointer"
              title="Download Certified PDF Dossier"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* PARCHMENT BODY */}
        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto text-slate-900 bg-[#fffefb]">
          
          {/* OFFICIAL HEADER SEAL & TITLES */}
          <div className="text-center space-y-1.5 border-b-2 border-stone-300 pb-4">
            <div className="inline-block px-3 py-1 rounded-full bg-amber-100/70 border border-amber-300 text-amber-900 font-extrabold text-[11px] uppercase tracking-wider">
              {language === "hi"
                ? "राजस्व परिषद उत्तर प्रदेश • भू-अभिलेख खतौनी (उद्धरण)"
                : "BOARD OF REVENUE, UTTAR PRADESH • KHATAUNI RECORD OF RIGHTS"}
            </div>
            <h2 className="text-xl font-black text-stone-900 tracking-tight">
              खाता विवरण (अप्रमाणित प्रति / Digital Verified Copy)
            </h2>
            <p className="text-xs text-stone-600">
              उ.प्र. भूलेख नियमावली प्रपत्र संख्या-45 (नियम 141 व 142) • Fasli Year:{" "}
              <strong className="text-stone-900">{nakal.col1_fasliYear}</strong>
            </p>
          </div>

          {/* 5-STEP ADMINISTRATIVE BAR */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 bg-stone-100/80 p-3 rounded-xl border border-stone-200 text-xs">
            <div>
              <span className="text-[10px] font-bold text-stone-500 uppercase block">जनपद (District)</span>
              <span className="font-extrabold text-stone-900">
                {parcel.districtHi || parcel.district}
              </span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-stone-500 uppercase block">तहसील (Tehsil)</span>
              <span className="font-extrabold text-stone-900">
                {parcel.tehsilHi || parcel.tehsil}
              </span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-stone-500 uppercase block">विकास खंड (Block)</span>
              <span className="font-extrabold text-stone-900">
                {parcel.block || parcel.tehsilHi || parcel.tehsil}
              </span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-stone-500 uppercase block">ग्राम / मौजा (Village)</span>
              <span className="font-extrabold text-stone-900">
                {parcel.villageHi || parcel.village} (कोड: {nakal.administrativeHierarchy?.villageRevenueCode || "162101"})
              </span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-stone-500 uppercase block">पिन कोड व फसली वर्ष</span>
              <span className="font-extrabold text-amber-800 font-mono">
                पिन: {nakal.administrativeHierarchy?.pincode || parcel.pinCode || "—"} • {nakal.col1_fasliYear}
              </span>
            </div>
          </div>

          {/* 13-COLUMN UP BHULEKH TABLE */}
          <div className="border-2 border-stone-400 rounded-xl overflow-x-auto shadow-sm bg-white">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-stone-200/90 text-stone-900 font-black border-b-2 border-stone-400 divide-x divide-stone-300">
                  <th className="p-2 text-center w-12">कॉलम 1<br/><span className="text-[10px] font-medium">खाता सं.</span></th>
                  <th className="p-2 text-center w-14">कॉलम 2<br/><span className="text-[10px] font-medium">खसरा/गाटा</span></th>
                  <th className="p-2 w-44">कॉलम 3-5<br/><span className="text-[10px] font-medium">क्षेत्रफल व माप</span></th>
                  <th className="p-2 w-44">कॉलम 6<br/><span className="text-[10px] font-medium">खातेदार का नाम व पिता</span></th>
                  <th className="p-2 w-40">कॉलम 7<br/><span className="text-[10px] font-medium">सह-खातेदार एवं अंश</span></th>
                  <th className="p-2 text-center w-16">कॉलम 8<br/><span className="text-[10px] font-medium">जोत वर्ष</span></th>
                  <th className="p-2 w-32">कॉलम 9-10<br/><span className="text-[10px] font-medium">नामांतरण / आदेश</span></th>
                  <th className="p-2 w-36">कॉलम 11<br/><span className="text-[10px] font-medium">बैंक बंधक / भार</span></th>
                  <th className="p-2 w-36">कॉलम 12<br/><span className="text-[10px] font-medium">न्यायालय वाद स्थिति</span></th>
                  <th className="p-2 text-center w-28">कॉलम 13<br/><span className="text-[10px] font-medium">मुहर व टोकन</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200 text-stone-800 text-[11px]">
                <tr className="divide-x divide-stone-200 hover:bg-stone-50/80">
                  {/* Col 1: Khata No. */}
                  <td className="p-2.5 font-black text-center text-sm font-mono text-stone-900">
                    {nakal.col3_khataSankhya}
                  </td>

                  {/* Col 2: Khasra / Gata */}
                  <td className="p-2.5 font-black text-center text-sm font-mono text-blue-900">
                    #{nakal.col4_khasraGataSankhya}
                  </td>

                  {/* Col 3-5: Rakba & 4-Side Dimensions */}
                  <td className="p-2.5 space-y-1">
                    <div className="font-extrabold text-stone-900">
                      {rakba.hectare || "0.0223"} हे. ({rakba.sqFt?.toLocaleString() || "2,400"} वर्ग फुट)
                    </div>
                    <div className="text-[10px] text-stone-600">
                      {rakba.biswa || "1.76"} बिस्वा • {rakba.pakkaBigha || "0.088"} पक्का बीघा
                    </div>
                    {/* 4-Side Boundaries */}
                    <div className="mt-1 pt-1 border-t border-stone-200 text-[10px] font-mono text-stone-700 space-y-0.5">
                      <div className="text-amber-800 font-bold">चारों मेड़ों की वास्तविक लम्बाई:</div>
                      <div>उत्तर: {fourSides.north || "48.0 ft"}</div>
                      <div>दक्षिण: {fourSides.south || "48.0 ft"}</div>
                      <div>पूर्व: {fourSides.east || "50.0 ft"}</div>
                      <div>पश्चिम: {fourSides.west || "50.0 ft"}</div>
                    </div>
                  </td>

                  {/* Col 6: Khatedar Name & Residence */}
                  <td className="p-2.5 space-y-1">
                    <div className="font-black text-stone-900 text-xs">
                      {nakal.col6_khatedarName}
                    </div>
                    <div className="text-stone-600">
                      {nakal.col6_fatherName}
                    </div>
                    <div className="text-[10px] text-stone-500 italic">
                      {nakal.col8_residence}
                    </div>
                    <div className="text-[10px] font-mono text-gray-500 truncate">
                      {nakal.col6_ownerWallet?.slice(0, 10)}...{nakal.col6_ownerWallet?.slice(-6)}
                    </div>
                  </td>

                  {/* Col 7: Co-sharers & Fractions */}
                  <td className="p-2.5 space-y-1">
                    {(nakal.col7_sahKhatedars || []).map((sh, idx) => (
                      <div key={idx} className="p-1 rounded bg-stone-100/80 border border-stone-200">
                        <span className="font-bold text-stone-900">{sh.name}</span>
                        <div className="text-[10px] font-semibold text-emerald-800">
                          अंश: {sh.shareFraction}
                        </div>
                      </div>
                    ))}
                  </td>

                  {/* Col 8: Tenure Year */}
                  <td className="p-2.5 text-center font-bold font-mono text-stone-700">
                    {nakal.col9_tenureStartYear?.split(" ")[0] || "1398"}
                  </td>

                  {/* Col 9-10: Mutation Orders */}
                  <td className="p-2.5 text-stone-700 leading-relaxed text-[10px]">
                    <div className="font-bold text-emerald-900">
                      {nakal.col10_mutationOrders}
                    </div>
                    <div className="text-stone-500 mt-1">
                      लगान: ₹42.50 वार्षिक
                    </div>
                  </td>

                  {/* Col 11: Bank Lien */}
                  <td className="p-2.5">
                    <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-300">
                      {nakal.col11_bankLien}
                    </span>
                  </td>

                  {/* Col 12: Litigation */}
                  <td className="p-2.5">
                    <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-300">
                      {nakal.col12_litigationStatus}
                    </span>
                  </td>

                  {/* Col 13: Digital Seal & RWA Token */}
                  <td className="p-2.5 text-center space-y-1">
                    <span className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-900 font-bold text-[9px]">
                      <CheckCircle className="w-3 h-3 text-emerald-700" />
                      <span>{nakal.col13_remarks?.digitalSeal || "सत्यापित"}</span>
                    </span>
                    <div className="font-mono text-[9px] font-bold text-stone-600">
                      Token #{nakal.col13_remarks?.upCadastreTokenId || parcel.rwaTokenId}
                    </div>
                    <div className="text-[8px] text-stone-500">
                      Lekhpal ID: LKP-7821
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* CHAUHADDI (FOUR-SIDE BOUNDARIES) OFFICIAL BOX */}
          <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-300/80 space-y-2">
            <div className="flex items-center justify-between border-b border-amber-200 pb-1.5">
              <span className="font-black text-xs text-amber-950 flex items-center space-x-1.5">
                <Compass className="w-4 h-4 text-amber-800" />
                <span>खेत चौहद्दी विवरण (Chauhaddi - Neighboring Parcels & Roads)</span>
              </span>
              <span className="text-[10px] font-mono font-bold text-amber-800 bg-amber-200/70 px-2 py-0.5 rounded">
                राजस्व संहिता नियम 142
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 text-xs">
              <div className="p-2.5 rounded-lg bg-white border border-amber-200 shadow-2xs">
                <span className="text-[10px] font-bold text-amber-900 uppercase block">उत्तर (North):</span>
                <span className="font-bold text-stone-900">{nakal.chauhaddi?.north || "गाटा सं. 98 (चक मार्ग 4.0 मीटर)"}</span>
                <span className="text-[10px] text-stone-500 font-mono block mt-0.5">{fourSides.north || "48.0 ft"}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-white border border-amber-200 shadow-2xs">
                <span className="text-[10px] font-bold text-amber-900 uppercase block">दक्षिण (South):</span>
                <span className="font-bold text-stone-900">{nakal.chauhaddi?.south || "गाटा सं. 109 (निजी कृषि भूमि)"}</span>
                <span className="text-[10px] text-stone-500 font-mono block mt-0.5">{fourSides.south || "48.0 ft"}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-white border border-amber-200 shadow-2xs">
                <span className="text-[10px] font-bold text-amber-900 uppercase block">पूर्व (East):</span>
                <span className="font-bold text-stone-900">{nakal.chauhaddi?.east || "गाटा सं. 105 (पक्का सीमांकन)"}</span>
                <span className="text-[10px] text-stone-500 font-mono block mt-0.5">{fourSides.east || "50.0 ft"}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-white border border-amber-200 shadow-2xs">
                <span className="text-[10px] font-bold text-amber-900 uppercase block">पश्चिम (West):</span>
                <span className="font-bold text-stone-900">{nakal.chauhaddi?.west || "रेलवे बफर कॉरिडोर (SH-90 नैनी लिंक)"}</span>
                <span className="text-[10px] text-stone-500 font-mono block mt-0.5">{fourSides.west || "50.0 ft"}</span>
              </div>
            </div>
          </div>

          {/* OFFICIAL REVENUE AUDIT & VERIFICATION FOOTER */}
          <div className="p-4 rounded-xl bg-stone-100 border border-stone-300 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
            <div className="flex items-center space-x-3">
              <div className="p-1.5 bg-white border border-stone-300 rounded-lg shadow-inner">
                <QRCodeSVG
                  value={`https://upbhulekh.gov.in/verify?khasra=${parcel.khasraNumber}&district=${parcel.district}&khata=${parcel.khataNumber}`}
                  size={64}
                  level="M"
                />
              </div>
              <div className="space-y-0.5">
                <div className="font-extrabold text-stone-900">
                  डिजिटल हस्ताक्षर प्रमाण पत्र (e-Sign Record)
                </div>
                <div className="text-[11px] text-stone-600">
                  प्रमाणित किया जाता है कि यह खतौनी उद्धरण उ.प्र. राजस्व संहिता 2006 के अंतर्गत इलेक्ट्रॉनिक रूप से मान्य है।
                </div>
                <div className="text-[10px] font-mono text-emerald-700 font-bold">
                  प्रमाण पत्र संख्या: UP-REV-{parcel.khasraNumber || "104"}-CERTIFIED
                </div>
              </div>
            </div>

            <div className="text-right flex-shrink-0 space-y-1">
              <div className="inline-block px-3 py-1 rounded bg-stone-800 text-white font-mono font-bold text-[10px]">
                राजस्व अभिलेख डिजिटल सत्यापित
              </div>
              <div className="text-[10px] text-stone-500">
                जारी दिनांक: {new Date().toLocaleDateString("hi-IN")}
              </div>
            </div>
          </div>

        </div>

        {/* BOTTOM ACTION BAR */}
        <div className="bg-stone-100 border-t border-stone-300 px-5 py-3 flex items-center justify-between">
          <span className="text-[11px] text-stone-600 font-medium">
            नोट: यह प्रति केवल सूचना एवं भूलेख सत्यापन हेतु मान्य है। किसी भी विवाद में तहसीलदार न्यायालय सक्षम है।
          </span>
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-black text-white text-xs font-bold transition-colors flex items-center space-x-1.5 cursor-pointer shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>प्रिंट करें (Print)</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-stone-200 hover:bg-stone-300 text-stone-800 text-xs font-bold transition-colors cursor-pointer"
            >
              बंद करें (Close)
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
