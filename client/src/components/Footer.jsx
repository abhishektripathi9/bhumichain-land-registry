import React, { useState } from "react";
import {
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Layers,
  ShieldCheck,
  FileText,
  Database,
  Cpu,
  Satellite,
  Lock,
  X,
  ExternalLink,
  CheckCircle2,
  Info,
  MapPin,
  PhoneCall,
  Globe,
  Scale
} from "lucide-react";

export default function Footer({ navigateToAdmin }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = 2;

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    }
  };

  return (
    <footer className="w-full bg-white border-t border-gray-200 z-30 flex-shrink-0 shadow-lg relative select-none">
      {/* 
        ========================================================================
        EXPANDABLE 2-PAGE DRAWER PANEL (Slides up when isExpanded === true)
        ========================================================================
      */}
      <div
        className={`transition-all duration-400 ease-in-out overflow-hidden bg-gradient-to-b from-gray-900 via-slate-900 to-gray-950 text-white ${
          isExpanded ? "max-h-[580px] border-b border-gray-800 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
          {/* Drawer Top Navigation Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2 mb-3 border-b border-slate-800 text-xs">
            {/* Title & Badge */}
            <div className="flex items-center space-x-2">
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                <ShieldCheck className="w-3 h-3 mr-1" />
                उ.प्र. भू-अभिलेख व वेब3 विनिर्देश
              </span>
              <span className="text-gray-400 font-medium hidden sm:inline text-[11px]">
                उत्तर प्रदेश डिजिटल भू-नक्शा एवं भूमि अभिलेख प्रणाली
              </span>
            </div>

            {/* Slide Navigation Tabs & Controls */}
            <div className="flex items-center space-x-2 sm:space-x-3">
              {/* Tab Pills */}
              <div className="flex items-center bg-slate-800/80 p-0.5 rounded-lg border border-slate-700">
                <button
                  onClick={() => setCurrentPage(1)}
                  className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                    currentPage === 1
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "text-slate-300 hover:text-white hover:bg-slate-700/50"
                  }`}
                >
                  <FileText className="w-3 h-3" />
                  <span>पेज 1: राजस्व व नागरिक सेवाएं</span>
                </button>
                <button
                  onClick={() => setCurrentPage(2)}
                  className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                    currentPage === 2
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "text-slate-300 hover:text-white hover:bg-slate-700/50"
                  }`}
                >
                  <Cpu className="w-3 h-3" />
                  <span>पेज 2: ब्लॉकचेन व GIS सुरक्षा</span>
                </button>
              </div>

              {/* Prev / Next Slide Arrow Buttons */}
              <div className="flex items-center space-x-1 bg-slate-800/60 p-0.5 rounded-md border border-slate-700">
                <button
                  onClick={handlePrevPage}
                  disabled={currentPage === 1}
                  className={`p-1 rounded text-slate-300 hover:text-white transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed`}
                  title="पिछला पेज (Previous Page)"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {/* Dot Indicators */}
                <div className="flex items-center space-x-1 px-1">
                  <span
                    onClick={() => setCurrentPage(1)}
                    className={`cursor-pointer transition-all rounded-full ${
                      currentPage === 1
                        ? "w-4 h-1.5 bg-emerald-400"
                        : "w-1.5 h-1.5 bg-slate-600 hover:bg-slate-400"
                    }`}
                  />
                  <span
                    onClick={() => setCurrentPage(2)}
                    className={`cursor-pointer transition-all rounded-full ${
                      currentPage === 2
                        ? "w-4 h-1.5 bg-indigo-400"
                        : "w-1.5 h-1.5 bg-slate-600 hover:bg-slate-400"
                    }`}
                  />
                </div>

                <button
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                  className={`p-1 rounded text-slate-300 hover:text-white transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed`}
                  title="अगला पेज (Next Page)"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Page Number Badge */}
              <span className="text-[11px] font-mono text-slate-400 px-1.5 py-0.5 rounded bg-slate-800/50 border border-slate-700/50 hidden md:inline">
                पेज {currentPage} / {totalPages}
              </span>

              {/* Close Drawer Button */}
              <button
                onClick={() => setIsExpanded(false)}
                className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                title="सिकोड़ें (Collapse Drawer)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* 
            SLIDER TRACK: Horizontal 2-Page Carousel
            w-[200%] width, shifted via translateX(0%) for Page 1 and translateX(-50%) for Page 2
          */}
          <div className="overflow-hidden w-full relative">
            <div
              className="flex w-[200%] transition-transform duration-500 ease-in-out"
              style={{
                transform: currentPage === 1 ? "translateX(0%)" : "translateX(-50%)",
              }}
            >
              {/* -------------------------------------------------------------
                  PAGE 1: उत्तर प्रदेश राजस्व व नागरिक सेवाएं (Revenue & Services)
                  ------------------------------------------------------------- */}
              <div className="w-1/2 flex-shrink-0 pr-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {/* Card 1: 75 जनपद व भूलेख नेटवर्क */}
                  <div className="bg-slate-800/70 border border-slate-700/70 rounded-xl p-3 shadow-md hover:border-emerald-500/50 transition-colors">
                    <div className="flex items-center space-x-2 mb-2 pb-1.5 border-b border-slate-700/60">
                      <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <MapPin className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <h4 className="text-[12px] font-bold text-white leading-tight">
                          75 जनपद व भूलेख नेटवर्क
                        </h4>
                        <span className="text-[10px] text-emerald-400 font-mono">
                          100% डिजिटल भूलेख प्रमाणित
                        </span>
                      </div>
                    </div>
                    <ul className="text-[11px] text-slate-300 space-y-1.5 leading-snug">
                      <li className="flex items-start space-x-1.5">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400 mt-0.5 flex-shrink-0" />
                        <span>
                          <strong>कवरेज:</strong> 75 जनपद, 351 तहसीलें, 826 विकास खंड
                        </span>
                      </li>
                      <li className="flex items-start space-x-1.5">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400 mt-0.5 flex-shrink-0" />
                        <span>
                          <strong>ग्राम डायरेक्टरी:</strong> 1,06,000+ राजस्व गाँव व गाटा संख्या
                        </span>
                      </li>
                      <li className="flex items-start space-x-1.5">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400 mt-0.5 flex-shrink-0" />
                        <span>
                          <strong>4-चरणीय खोज:</strong> जनपद ➔ तहसील ➔ विकास खंड ➔ गाँव
                        </span>
                      </li>
                    </ul>
                  </div>

                  {/* Card 2: नागरिक डिजिटल सेवाएं */}
                  <div className="bg-slate-800/70 border border-slate-700/70 rounded-xl p-3 shadow-md hover:border-emerald-500/50 transition-colors">
                    <div className="flex items-center space-x-2 mb-2 pb-1.5 border-b border-slate-700/60">
                      <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        <FileText className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <h4 className="text-[12px] font-bold text-white leading-tight">
                          नागरिक डिजिटल सेवाएं (Form 45)
                        </h4>
                        <span className="text-[10px] text-blue-400 font-mono">
                          UP Revenue Code 2006
                        </span>
                      </div>
                    </div>
                    <ul className="text-[11px] text-slate-300 space-y-1.5 leading-snug">
                      <li className="flex items-start space-x-1.5">
                        <CheckCircle2 className="w-3 h-3 text-blue-400 mt-0.5 flex-shrink-0" />
                        <span>
                          <strong>13-कॉलम खतौनी:</strong> प्रमाणित कम्प्यूटरीकृत नकल डाउनलोड
                        </span>
                      </li>
                      <li className="flex items-start space-x-1.5">
                        <CheckCircle2 className="w-3 h-3 text-blue-400 mt-0.5 flex-shrink-0" />
                        <span>
                          <strong>DGPS सीमांकन:</strong> 4-भुजा (उत्तर/दक्षिण/पूर्व/पश्चिम) फीट माप
                        </span>
                      </li>
                      <li className="flex items-start space-x-1.5">
                        <CheckCircle2 className="w-3 h-3 text-blue-400 mt-0.5 flex-shrink-0" />
                        <span>
                          <strong>सर्किल रेट:</strong> डीएम सर्किल रेट 2024 व स्टाम्प ड्यूटी गणना
                        </span>
                      </li>
                    </ul>
                  </div>

                  {/* Card 3: स्वामित्व व विवाद निवारण */}
                  <div className="bg-slate-800/70 border border-slate-700/70 rounded-xl p-3 shadow-md hover:border-emerald-500/50 transition-colors">
                    <div className="flex items-center space-x-2 mb-2 pb-1.5 border-b border-slate-700/60">
                      <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        <Scale className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <h4 className="text-[12px] font-bold text-white leading-tight">
                          स्वामित्व व विवाद निवारण
                        </h4>
                        <span className="text-[10px] text-amber-400 font-mono">
                          RCCMS & CERSAI Verified
                        </span>
                      </div>
                    </div>
                    <ul className="text-[11px] text-slate-300 space-y-1.5 leading-snug">
                      <li className="flex items-start space-x-1.5">
                        <CheckCircle2 className="w-3 h-3 text-amber-400 mt-0.5 flex-shrink-0" />
                        <span>
                          <strong>बैंक बंधक स्थिति:</strong> CERSAI व KCC ऋण-मुक्त सत्यापन
                        </span>
                      </li>
                      <li className="flex items-start space-x-1.5">
                        <CheckCircle2 className="w-3 h-3 text-amber-400 mt-0.5 flex-shrink-0" />
                        <span>
                          <strong>विवाद जांच:</strong> राजस्व न्यायालय (RCCMS) शून्य-केस पुष्टि
                        </span>
                      </li>
                      <li className="flex items-start space-x-1.5">
                        <CheckCircle2 className="w-3 h-3 text-amber-400 mt-0.5 flex-shrink-0" />
                        <span>
                          <strong>धारा 80/143:</strong> कृषि से गैर-कृषि उपयोग अद्यतन स्थिति
                        </span>
                      </li>
                    </ul>
                  </div>

                  {/* Card 4: आधिकारिक सहायता व संपर्क */}
                  <div className="bg-slate-800/70 border border-slate-700/70 rounded-xl p-3 shadow-md hover:border-emerald-500/50 transition-colors">
                    <div className="flex items-center space-x-2 mb-2 pb-1.5 border-b border-slate-700/60">
                      <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <PhoneCall className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <h4 className="text-[12px] font-bold text-white leading-tight">
                          सहायता व आधिकारिक संपर्क
                        </h4>
                        <span className="text-[10px] text-emerald-400 font-mono">
                          Citizen Support UP
                        </span>
                      </div>
                    </div>
                    <ul className="text-[11px] text-slate-300 space-y-1.5 leading-snug">
                      <li className="flex items-start space-x-1.5">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400 mt-0.5 flex-shrink-0" />
                        <span>
                          <strong>मुख्यमंत्री हेल्पलाइन:</strong> डायल <strong>1076</strong> (जनसुनवाई IGRS)
                        </span>
                      </li>
                      <li className="flex items-start space-x-1.5">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400 mt-0.5 flex-shrink-0" />
                        <span>
                          <strong>एंटी-भूमाफिया प्रकोष्ठ:</strong> 4-स्तरीय टास्क फोर्स निगरानी
                        </span>
                      </li>
                      <li className="flex items-start space-x-1.5">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400 mt-0.5 flex-shrink-0" />
                        <span>
                          <strong>राजस्व परिषद:</strong> bor.up.nic.in • igrsup.gov.in
                        </span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* -------------------------------------------------------------
                  PAGE 2: ब्लॉकचेन, IPFS व GIS सुरक्षा (Web3 & GIS Specs)
                  ------------------------------------------------------------- */}
              <div className="w-1/2 flex-shrink-0 pl-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {/* Card 1: पॉलीगॉन स्मार्ट अनुबंध */}
                  <div className="bg-slate-800/70 border border-slate-700/70 rounded-xl p-3 shadow-md hover:border-indigo-500/50 transition-colors">
                    <div className="flex items-center space-x-2 mb-2 pb-1.5 border-b border-slate-700/60">
                      <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                        <Cpu className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <h4 className="text-[12px] font-bold text-white leading-tight">
                          डिजिटल सत्यापन व सुरक्षा
                        </h4>
                        <span className="text-[10px] text-indigo-400 font-medium">
                          सुरक्षित प्रमाणित सर्वर
                        </span>
                      </div>
                    </div>
                    <ul className="text-[11px] text-slate-300 space-y-1.5 leading-snug">
                      <li className="flex items-start space-x-1.5">
                        <CheckCircle2 className="w-3 h-3 text-indigo-400 mt-0.5 flex-shrink-0" />
                        <span>
                          <strong>प्रमाणन:</strong> <span className="text-[10px] text-indigo-300">डिजिटल रूप से प्रमाणित</span>
                        </span>
                      </li>
                      <li className="flex items-start space-x-1.5">
                        <CheckCircle2 className="w-3 h-3 text-indigo-400 mt-0.5 flex-shrink-0" />
                        <span>
                          <strong>स्वामित्व प्रमाणपत्र:</strong> डिजिटल अपरिवर्तनीय भू-स्वामित्व प्रमाणपत्र
                        </span>
                      </li>
                      <li className="flex items-start space-x-1.5">
                        <CheckCircle2 className="w-3 h-3 text-indigo-400 mt-0.5 flex-shrink-0" />
                        <span>
                          <strong>एस्क्रो लॉक:</strong> 10% बयाना ऑटो-लॉक व शून्य-धोखाधड़ी
                        </span>
                      </li>
                    </ul>
                  </div>

                  {/* Card 2: सुरक्षित डिजिटल दस्तावेज संचयन */}
                  <div className="bg-slate-800/70 border border-slate-700/70 rounded-xl p-3 shadow-md hover:border-indigo-500/50 transition-colors">
                    <div className="flex items-center space-x-2 mb-2 pb-1.5 border-b border-slate-700/60">
                      <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                        <Database className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <h4 className="text-[12px] font-bold text-white leading-tight">
                          सुरक्षित डिजिटल दस्तावेज संचयन
                        </h4>
                        <span className="text-[10px] text-cyan-400 font-mono">
                          सुरक्षित क्लाउड स्टोरेज
                        </span>
                      </div>
                    </div>
                    <ul className="text-[11px] text-slate-300 space-y-1.5 leading-snug">
                      <li className="flex items-start space-x-1.5">
                        <CheckCircle2 className="w-3 h-3 text-cyan-400 mt-0.5 flex-shrink-0" />
                        <span>
                          <strong>डिजिटल सील:</strong> सुरक्षित दस्तावेज कोड <span className="font-mono text-[10px] text-cyan-300">UP-REG-2024-DOC</span>
                        </span>
                      </li>
                      <li className="flex items-start space-x-1.5">
                        <CheckCircle2 className="w-3 h-3 text-cyan-400 mt-0.5 flex-shrink-0" />
                        <span>
                          <strong>प्रमाणीकरण:</strong> SHA-256 अपरिवर्तनीय रजिस्ट्री सुरक्षा
                        </span>
                      </li>
                      <li className="flex items-start space-x-1.5">
                        <CheckCircle2 className="w-3 h-3 text-cyan-400 mt-0.5 flex-shrink-0" />
                        <span>
                          <strong>भू-नक्शा संचयन:</strong> 100% जियोरेफरेंस्ड डिजिटल कैडस्ट्रे
                        </span>
                      </li>
                    </ul>
                  </div>

                  {/* Card 3: NavIC RTK व GIS ऑर्थो-परिशुद्धता */}
                  <div className="bg-slate-800/70 border border-slate-700/70 rounded-xl p-3 shadow-md hover:border-indigo-500/50 transition-colors">
                    <div className="flex items-center space-x-2 mb-2 pb-1.5 border-b border-slate-700/60">
                      <div className="p-1.5 rounded-lg bg-teal-500/10 text-teal-400 border border-teal-500/20">
                        <Satellite className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <h4 className="text-[12px] font-bold text-white leading-tight">
                          उपग्रह नक्शा व सटीक सीमांकन
                        </h4>
                        <span className="text-[10px] text-teal-400 font-medium">
                          डिजिटल सर्वे व उपग्रह नक्शा
                        </span>
                      </div>
                    </div>
                    <ul className="text-[11px] text-slate-300 space-y-1.5 leading-snug">
                      <li className="flex items-start space-x-1.5">
                        <CheckCircle2 className="w-3 h-3 text-teal-400 mt-0.5 flex-shrink-0" />
                        <span>
                          <strong>सीमांकन शुद्धता:</strong> उच्च परिशुद्धता भू-सीमांकन सटीकता
                        </span>
                      </li>
                      <li className="flex items-start space-x-1.5">
                        <CheckCircle2 className="w-3 h-3 text-teal-400 mt-0.5 flex-shrink-0" />
                        <span>
                          <strong>प्रक्षेपण मानक:</strong> डिजिटल राजस्व भू-निर्देशांक
                        </span>
                      </li>
                      <li className="flex items-start space-x-1.5">
                        <CheckCircle2 className="w-3 h-3 text-teal-400 mt-0.5 flex-shrink-0" />
                        <span>
                          <strong>सैटेलाइट इमेजरी:</strong> Esri World Satellite 2024
                        </span>
                      </li>
                    </ul>
                  </div>

                  {/* Card 4: 100% लाइव सरकारी API पाइपलाइन */}
                  <div className="bg-slate-800/70 border border-slate-700/70 rounded-xl p-3 shadow-md hover:border-indigo-500/50 transition-colors">
                    <div className="flex items-center space-x-2 mb-2 pb-1.5 border-b border-slate-700/60">
                      <div className="p-1.5 rounded-lg bg-violet-500/10 text-violet-400 border border-violet-500/20">
                        <Globe className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <h4 className="text-[12px] font-bold text-white leading-tight">
                          लाइव सरकारी API पाइपलाइन
                        </h4>
                        <span className="text-[10px] text-violet-400 font-mono">
                          Zero Mock • 100% Live
                        </span>
                      </div>
                    </div>
                    <ul className="text-[11px] text-slate-300 space-y-1.5 leading-snug">
                      <li className="flex items-start space-x-1.5">
                        <CheckCircle2 className="w-3 h-3 text-violet-400 mt-0.5 flex-shrink-0" />
                        <span>
                          <strong>राजस्व परिषद:</strong> आधिकारिक जनपद, तहसील व ब्लॉक
                        </span>
                      </li>
                      <li className="flex items-start space-x-1.5">
                        <CheckCircle2 className="w-3 h-3 text-violet-400 mt-0.5 flex-shrink-0" />
                        <span>
                          <strong>India Post API:</strong> 100% वास्तविक 6-अंकीय पिनकोड
                        </span>
                      </li>
                      <li className="flex items-start space-x-1.5">
                        <CheckCircle2 className="w-3 h-3 text-violet-400 mt-0.5 flex-shrink-0" />
                        <span>
                          <strong>OSM Overpass Cadastre:</strong> वास्तविक खेत बहुभुज
                        </span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 
        ========================================================================
        DOCKED BOTTOM FOOTER BAR (Always visible at the bottom)
        ========================================================================
      */}
      <div className="py-2 px-4 sm:px-6 text-xs text-gray-500 flex flex-col sm:flex-row items-center justify-between gap-2">
        {/* Left: Official State Portal Branding */}
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1.5 font-bold text-gray-800 text-[11px]">
            <span>उत्तर प्रदेश डिजिटल भूमि एवं नक्शा जानकारी पोर्टल — सभी 75 जिलों के लिए</span>
          </div>
          <span className="hidden md:inline text-gray-300">•</span>
          <span className="text-[11px] text-gray-500 hidden md:inline">
            राजस्व परिषद उत्तर प्रदेश • सभी 75 जिलों के किसानों के लिए समर्पित
          </span>
        </div>

        {/* Center: Live State Cadastre Certification */}
        <div className="flex items-center space-x-2 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full text-[11px] font-medium text-emerald-900">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>प्रमाणित सरकारी डिजिटल भूलेख • उत्तर प्रदेश राजस्व परिषद • 100% सुरक्षित एवं पारदर्शी (0 विवाद)</span>
        </div>

        {/* Right: Expand/Collapse Slider Button + Officer Login Gateway */}
        <div className="flex items-center space-x-2.5">
          {/* 
            EXPAND/SLIDE TOGGLE BUTTON
            Allows toggling open the 2-page drawer and indicates slider functionality
          */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={`flex items-center space-x-1.5 px-3 py-1 rounded-lg text-[11px] font-bold border transition-all cursor-pointer shadow-xs ${
              isExpanded
                ? "bg-slate-900 text-white border-slate-800 hover:bg-slate-800 ring-2 ring-emerald-500/30"
                : "bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100 hover:border-emerald-400"
            }`}
            title={isExpanded ? "सिकोड़ें (Collapse Drawer)" : "विस्तृत विवरण देखें (2 पेज स्लाइडर)"}
          >
            {isExpanded ? (
              <>
                <ChevronDown className="w-3.5 h-3.5 text-emerald-400" />
                <span>▼ सिकोड़ें / Collapse</span>
              </>
            ) : (
              <>
                <ChevronUp className="w-3.5 h-3.5 text-emerald-600" />
                <span>▲ विस्तृत विवरण (2 पेज स्लाइडर)</span>
                <span className="px-1 py-0.2 text-[9px] bg-emerald-200 text-emerald-800 rounded font-mono ml-0.5">
                  2 Pages
                </span>
              </>
            )}
          </button>

          {/* Official Officer Registrar Link */}
          <button
            onClick={navigateToAdmin}
            className="flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-[11px] font-bold transition-colors cursor-pointer"
            title="उत्तर प्रदेश राजस्व अधिकारी लॉगिन"
          >
            <Lock className="w-3 h-3 text-blue-600" />
            <span>अधिकारी लॉगिन (Official Login)</span>
          </button>
        </div>
      </div>
    </footer>
  );
}
