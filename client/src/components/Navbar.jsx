import React, { useState } from "react";
import { useWeb3 } from "../context/Web3Context";
import { useLanguage } from "../context/LanguageContext";
import { getApiUrl, API_BASE_URL } from "../utils/apiConfig";
import {
  ShieldCheck,
  Crosshair,
  CheckCircle,
  User,
  LogOut,
  X,
  Phone,
  Sparkles,
  Globe,
} from "lucide-react";

export default function Navbar({ activeTab, setActiveTab, onScanGPS, currentDistrict, onNavigateToAdmin }) {
  const {
    account,
    connectWallet,
    selectDemoAccount,
    demoAccounts,
  } = useWeb3();

  const { language, toggleLanguage, setLanguage, t } = useLanguage();

  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const [showCitizenModal, setShowCitizenModal] = useState(false);
  const [citizenTab, setCitizenTab] = useState("login"); // 'login' | 'register'
  const [citizenProfileOpen, setCitizenProfileOpen] = useState(false);

  // UP Citizen state stored in localStorage for persistence
  const [citizenUser, setCitizenUser] = useState(() => {
    try {
      const saved = localStorage.getItem("bhumichain_citizen_user");
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    // Default clean UP Citizen session (Zero hardcoded district/village)
    return {
      name: "उत्तर प्रदेश नागरिक (UP Citizen)",
      nameEn: "UP Citizen",
      phone: "+91 98765-43210",
      aadhaarRef: "•••• •••• 9214",
      citizenType: "farmer",
      state: "Uttar Pradesh",
      district: "",
      tehsil: "",
      village: "",
      khasraNumber: "",
      kycVerified: true,
    };
  });

  // Login Form State
  const [loginPhone, setLoginPhone] = useState("+91 98765-43210");
  const [loginOtp, setLoginOtp] = useState("782194");

  // Registration Form State
  const [regForm, setRegForm] = useState({
    name: "",
    phone: "",
    aadhaarRef: "",
    citizenType: "farmer",
    state: "Uttar Pradesh",
    district: "Prayagraj",
    tehsil: "Karchhana",
    village: "Naini",
    khasraNumber: "",
  });
  const [authLoading, setAuthLoading] = useState(false);
  const [authSuccessMsg, setAuthSuccessMsg] = useState("");

  const handleLoginSubmit = async (e) => {
    if (e) e.preventDefault();
    setAuthLoading(true);
    try {
      const res = await fetch(getApiUrl("auth/login-citizen"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: loginPhone }),
      });
      const data = await res.json();
      if (data.success && data.user) {
        setCitizenUser(data.user);
        localStorage.setItem("bhumichain_citizen_user", JSON.stringify(data.user));
        setAuthSuccessMsg(
          language === "hi"
            ? "लॉगिन सफल! उत्तर प्रदेश ई-केवाईसी सत्यापित नागरिक सत्र सक्रिय।"
            : "Login Successful! UP e-KYC Verified Citizen Session Active."
        );
        setTimeout(() => {
          setShowCitizenModal(false);
          setAuthSuccessMsg("");
        }, 1200);
      }
    } catch (err) {
      // Offline fallback
      const fallbackUser = {
        name: "प्रयागराज काश्तकार (Prayagraj Farmer)",
        nameEn: "Prayagraj Farmer",
        phone: loginPhone,
        aadhaarRef: "•••• •••• 4421",
        citizenType: "farmer",
        state: "Uttar Pradesh",
        district: "Prayagraj",
        tehsil: "Karchhana",
        village: "Naini",
        khasraNumber: "104",
        kycVerified: true,
      };
      setCitizenUser(fallbackUser);
      localStorage.setItem("bhumichain_citizen_user", JSON.stringify(fallbackUser));
      setShowCitizenModal(false);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (!regForm.name || !regForm.phone) {
      alert(
        language === "hi"
          ? "कृपया नाम और मोबाइल नंबर भरें"
          : "Please enter Name & Phone Number"
      );
      return;
    }
    setAuthLoading(true);
    try {
      const res = await fetch(getApiUrl("auth/register-citizen"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(regForm),
      });
      const data = await res.json();
      const user = data.user || {
        ...regForm,
        kycVerified: true,
        aadhaarRef: regForm.aadhaarRef || "•••• •••• " + Math.floor(1000 + Math.random() * 9000),
      };
      setCitizenUser(user);
      localStorage.setItem("bhumichain_citizen_user", JSON.stringify(user));
      setAuthSuccessMsg(
        language === "hi"
          ? "पंजीकरण सफल! आपका डिजिटल किसान/नागरिक खाता सक्रिय हो गया है।"
          : "Registration Successful! Your UP Citizen account is active."
      );
      setTimeout(() => {
        setShowCitizenModal(false);
        setAuthSuccessMsg("");
      }, 1400);
    } catch (err) {
      const fallbackUser = {
        ...regForm,
        kycVerified: true,
        aadhaarRef: regForm.aadhaarRef || "•••• •••• 8821",
      };
      setCitizenUser(fallbackUser);
      localStorage.setItem("bhumichain_citizen_user", JSON.stringify(fallbackUser));
      setShowCitizenModal(false);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogoutCitizen = () => {
    localStorage.removeItem("bhumichain_citizen_user");
    setCitizenUser(null);
    setCitizenProfileOpen(false);
  };

  // Formatted wallet address or Citizen Ref
  const displayWallet = account
    ? `${account.slice(0, 5)}...${account.slice(-4).toUpperCase()}`
    : "सत्यापित खाता";

  const navItems = [
    { id: "map", label: t("exploreMap") },
    { id: "marketplace", label: language === "hi" ? "खेत खरीदें / बेचें" : "Buy & Sell Land" },
    { id: "register", label: t("registerLand") },
    { id: "my-properties", label: t("myProperties") },
    { id: "verify-qr", label: t("verifyQR") },
  ];

  return (
    <>
      <nav className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-2xs">
        <div className="max-w-[1920px] mx-auto px-3 sm:px-6">
          <div className="flex items-center justify-between h-16">
            {/* ================= LEFT SECTION ================= */}
            <div className="flex items-center space-x-4 sm:space-x-6">
              {/* Logo + State Land Portal UP-GIS Emblem */}
              <div
                className="flex items-center space-x-2.5 sm:space-x-3 cursor-pointer select-none"
                onClick={() => setActiveTab("map")}
              >
                {/* Emblem icon */}
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center shadow-xs border border-emerald-400/40 flex-shrink-0">
                  <ShieldCheck className="w-6 h-6 text-white" />
                </div>

                {/* Title & Badge */}
                <div className="flex flex-col">
                  <div className="flex items-center space-x-2">
                    <span className="font-extrabold text-base tracking-tight text-gray-900">
                      BhumiChain
                    </span>
                    <div className="px-2 py-0.5 rounded-md bg-blue-50 border border-blue-200 text-blue-700 text-[10px] font-semibold leading-tight flex items-center space-x-1">
                      <span>{language === "hi" ? "उ.प्र. भूलेख पोर्टल •" : "State Land Portal •"}</span>
                      <span className="font-bold">उ.प्र.</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold text-emerald-800 tracking-tight hidden sm:inline">
                    उत्तर प्रदेश डिजिटल जमीन व नक्शा पोर्टल (UP Land & Map Portal)
                  </span>
                </div>
              </div>

              {/* Public Navigation Tabs */}
              <div className="hidden lg:flex items-center space-x-1 pl-2">
                {navItems.map((tab) => {
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                        isActive
                          ? "bg-[#eef4ff] text-[#1d4ed8] border border-[#dbeafe] shadow-2xs font-bold"
                          : "text-gray-600 hover:text-gray-900 hover:bg-gray-100/70"
                      }`}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ================= RIGHT SECTION ================= */}
            <div className="flex items-center space-x-2 sm:space-x-2.5">
              {/* 1. Language Switcher Button (हिंदी / English) */}
              <div className="flex items-center bg-gray-100 p-0.5 rounded-lg border border-gray-300">
                <button
                  onClick={() => setLanguage("hi")}
                  className={`px-2 py-1 rounded-md text-xs font-bold transition-all flex items-center space-x-1 ${
                    language === "hi"
                      ? "bg-white text-emerald-800 shadow-xs border border-gray-200"
                      : "text-gray-500 hover:text-gray-900"
                  }`}
                  title="पूर्ण वेबसाइट हिंदी में देखें"
                >
                  <span>हिं</span>
                </button>
                <button
                  onClick={() => setLanguage("en")}
                  className={`px-2 py-1 rounded-md text-xs font-bold transition-all flex items-center space-x-1 ${
                    language === "en"
                      ? "bg-white text-blue-800 shadow-xs border border-gray-200"
                      : "text-gray-500 hover:text-gray-900"
                  }`}
                  title="Switch full website to English"
                >
                  <span>EN</span>
                </button>
              </div>

              {/* 2. Top Right Pill: सरल किसान सेवा (Citizen Portal) */}
              <div className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-bold shadow-2xs">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-[11px]">सरल किसान सेवा (Citizen Portal)</span>
              </div>

              {/* 3. UP Citizen / Farmer Registration & Login Button */}
              {citizenUser ? (
                <div className="relative">
                  <button
                    onClick={() => setCitizenProfileOpen(!citizenProfileOpen)}
                    className="flex items-center space-x-2 px-2.5 sm:px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-300 text-emerald-900 text-xs font-semibold transition-colors shadow-2xs"
                    title={language === "hi" ? "सत्यापित प्रोफाइल देखें" : "View Verified Citizen Profile"}
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
                    <span className="truncate max-w-[140px] sm:max-w-[200px] font-bold text-xs">
                      🌾 {currentDistrict ? `${currentDistrict} काश्तकार` : citizenUser.district ? `${citizenUser.district} काश्तकार` : "उ.प्र. काश्तकार"}
                    </span>
                  </button>

                  {/* Citizen Profile Dropdown Popover */}
                  {citizenProfileOpen && (
                    <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-white border border-gray-200 shadow-2xl p-4 z-50 space-y-3 animate-in fade-in zoom-in-95 duration-100">
                      <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                        <div className="flex items-center space-x-1.5">
                          <CheckCircle className="w-4 h-4 text-emerald-600" />
                          <span className="font-bold text-xs text-gray-900">
                            {language === "hi" ? "सत्यापित उत्तर प्रदेश नागरिक" : "Verified UP Citizen Profile"}
                          </span>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 uppercase">
                          e-KYC Verified
                        </span>
                      </div>

                      <div className="space-y-1.5 text-xs text-gray-700">
                        <div className="flex justify-between py-1 border-b border-gray-50">
                          <span className="text-gray-400">{language === "hi" ? "नाम (Name):" : "Name:"}</span>
                          <span className="font-bold text-gray-900">{citizenUser.name}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-gray-50">
                          <span className="text-gray-400">{language === "hi" ? "श्रेणी (Role):" : "Category:"}</span>
                          <span className="font-bold text-emerald-700">
                            {citizenUser.citizenType === "farmer"
                              ? language === "hi" ? "भूमि स्वामी / किसान" : "Farmer / Land Owner"
                              : language === "hi" ? "क्रेता / नागरिक" : "Buyer / Citizen"}
                          </span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-gray-50">
                          <span className="text-gray-400">{language === "hi" ? "मोबाइल (Phone):" : "Phone:"}</span>
                          <span className="font-mono text-gray-800">{citizenUser.phone}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-gray-50">
                          <span className="text-gray-400">{language === "hi" ? "आधार संदर्भ (Aadhaar):" : "Aadhaar Ref:"}</span>
                          <span className="font-mono text-gray-800">{citizenUser.aadhaarRef}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-gray-50">
                          <span className="text-gray-400">{language === "hi" ? "जनपद / तहसील:" : "District / Tehsil:"}</span>
                          <span className="font-semibold text-gray-800">
                            {citizenUser.district} • {citizenUser.tehsil}
                          </span>
                        </div>
                        {citizenUser.khasraNumber && (
                          <div className="flex justify-between py-1 border-b border-gray-50">
                            <span className="text-gray-400">{language === "hi" ? "संबद्ध खसरा नं.:" : "Linked Khasra:"}</span>
                            <span className="font-bold text-blue-700 font-mono">
                              #{citizenUser.khasraNumber} ({citizenUser.village})
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="pt-2 flex items-center space-x-2">
                        <button
                          onClick={() => {
                            setCitizenProfileOpen(false);
                            setShowCitizenModal(true);
                          }}
                          className="flex-1 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-semibold text-center transition-colors"
                        >
                          {language === "hi" ? "प्रोफ़ाइल बदलें" : "Switch Profile"}
                        </button>
                        <button
                          onClick={handleLogoutCitizen}
                          className="py-1.5 px-3 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold flex items-center space-x-1 transition-colors"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span>{language === "hi" ? "लॉगआउट" : "Logout"}</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => setShowCitizenModal(true)}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs active:scale-[0.98]"
                >
                  <User className="w-3.5 h-3.5" />
                  <span>{t("citizenLoginBtn")}</span>
                </button>
              )}

              {/* 4. Scan GPS Location Button */}
              <button
                onClick={onScanGPS}
                className="flex items-center space-x-1.5 sm:space-x-2 px-3 sm:px-4 py-2 rounded-lg bg-black hover:bg-gray-900 text-white text-xs font-semibold transition-all shadow-sm active:scale-[0.98] cursor-pointer"
                title={language === "hi" ? "अपनी लाइव जीपीएस लोकेशन स्कैन करें" : "Scan Your Physical GPS Location"}
              >
                <Crosshair className="w-4 h-4 text-emerald-400 animate-pulse" />
                <span className="hidden sm:inline">{t("scanGPS")}</span>
                <span className="sm:hidden">GPS</span>
              </button>

              {/* 4.5. Admin / Registrar Console Direct Button */}
              <button
                onClick={() => {
                  if (onNavigateToAdmin) {
                    onNavigateToAdmin();
                  } else {
                    window.location.href = "/admin";
                  }
                }}
                className="flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-sm active:scale-[0.98] border border-slate-700 cursor-pointer"
                title={language === "hi" ? "सरकारी पंजीयक व राजस्व एडमिन पैनल खोलें" : "Open Government Registrar & Admin Panel"}
              >
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span className="hidden md:inline">{language === "hi" ? "पंजीयक एडमिन" : "Admin Panel"}</span>
                <span className="md:hidden">Admin</span>
              </button>

              {/* 5. Verified Citizen/Landholder Badge with Avatar */}
              <div className="relative">
                <button
                  onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
                  className="flex items-center space-x-2 bg-white border border-gray-300 hover:border-gray-400 rounded-lg px-2 sm:px-3 py-1 text-left transition-colors shadow-2xs cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-gray-900 leading-tight">
                      {citizenUser?.name ? (citizenUser.name.split(" ")[0] + " " + (citizenUser.name.split(" ")[1] || "")) : "राम प्रकाश यादव"}
                    </span>
                    <span className="text-[9px] font-bold text-emerald-700 tracking-tight leading-tight">
                      ✓ {language === "hi" ? "प्रमाणित खातेदार" : "Verified Landholder"}
                    </span>
                  </div>
                  <img
                    src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=80&q=80"
                    alt="Proprietor Avatar"
                    className="w-7 h-7 rounded-full object-cover border border-gray-200 ml-1 hidden md:inline-block"
                  />
                </button>

                {/* Demo Account Switcher Dropdown */}
                {roleDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-72 rounded-xl bg-white border border-gray-200 shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                    <div className="px-3.5 py-1.5 border-b border-gray-100 flex items-center justify-between">
                      <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                        {t("switchCitizenWallet")}
                      </span>
                      <span className="text-[10px] text-emerald-600 font-mono font-bold">
                        Mainnet Node
                      </span>
                    </div>
                    {demoAccounts
                      .filter((a) => !a.role.includes("Admin") && !a.role.includes("Registrar"))
                      .concat([
                        demoAccounts[2], // Rajesh Kumar Verma
                        demoAccounts[3], // Amit Saxena
                      ])
                      .slice(0, 3)
                      .map((acc, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            selectDemoAccount(acc.address);
                            setRoleDropdownOpen(false);
                          }}
                          className="w-full text-left px-3.5 py-2 hover:bg-gray-50 transition-colors flex flex-col border-b border-gray-50 last:border-b-0"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs text-gray-900">{acc.role}</span>
                            {account?.toLowerCase() === acc.address.toLowerCase() && (
                              <span className="text-[10px] text-emerald-600 font-mono font-bold flex items-center space-x-1">
                                <CheckCircle className="w-3 h-3 inline" />
                                <span>Active</span>
                              </span>
                            )}
                          </div>
                          <span className="text-gray-500 text-[11px]">{acc.label}</span>
                          <span className="text-[10px] text-gray-400 font-mono">
                            {acc.address}
                          </span>
                        </button>
                      ))}
                    <div className="p-2 border-t border-gray-100 space-y-1.5">
                      <button
                        onClick={() => {
                          setRoleDropdownOpen(false);
                          if (onNavigateToAdmin) {
                            onNavigateToAdmin();
                          } else {
                            window.location.href = "/admin";
                          }
                        }}
                        className="w-full py-2 px-3 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 font-bold text-xs flex items-center justify-between transition-colors shadow-2xs cursor-pointer"
                      >
                        <span className="flex items-center space-x-1.5">
                          <ShieldCheck className="w-4 h-4 text-emerald-600" />
                          <span>{t("enterAdminConsole")}</span>
                        </span>
                        <span className="text-[10px] font-mono text-emerald-700 font-bold">/admin →</span>
                      </button>

                      <button
                        onClick={() => {
                          connectWallet();
                          setRoleDropdownOpen(false);
                        }}
                        className="w-full py-1.5 rounded-lg bg-gray-900 hover:bg-black text-white font-semibold text-xs text-center transition-colors"
                      >
                        {t("connectExternal")}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* ========================================================================= */}
      {/* UP CITIZEN & FARMER LOGIN / REGISTRATION MODAL                            */}
      {/* ========================================================================= */}
      {showCitizenModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-emerald-700 via-emerald-800 to-teal-800 p-5 text-white flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center">
                    <ShieldCheck className="w-4 h-4 text-emerald-200" />
                  </div>
                  <span className="text-xs font-mono font-bold tracking-wider text-emerald-200 uppercase">
                    {t("portalGov")}
                  </span>
                </div>
                <h3 className="text-lg font-black tracking-tight">
                  {t("portalTitle")}
                </h3>
                <p className="text-xs text-emerald-100/90 font-medium">
                  {t("portalSub")}
                </p>
              </div>

              <button
                onClick={() => setShowCitizenModal(false)}
                className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Success Message Banner */}
            {authSuccessMsg && (
              <div className="p-3 bg-emerald-50 border-b border-emerald-200 text-emerald-800 text-xs font-bold flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>{authSuccessMsg}</span>
              </div>
            )}

            {/* Modal Navigation Tabs */}
            <div className="flex border-b border-gray-200 bg-gray-50/70">
              <button
                onClick={() => setCitizenTab("login")}
                className={`flex-1 py-3 text-xs font-bold text-center transition-all border-b-2 ${
                  citizenTab === "login"
                    ? "border-emerald-600 text-emerald-700 bg-white"
                    : "border-transparent text-gray-500 hover:text-gray-800"
                }`}
              >
                {t("tabLogin")}
              </button>
              <button
                onClick={() => setCitizenTab("register")}
                className={`flex-1 py-3 text-xs font-bold text-center transition-all border-b-2 ${
                  citizenTab === "register"
                    ? "border-emerald-600 text-emerald-700 bg-white"
                    : "border-transparent text-gray-500 hover:text-gray-800"
                }`}
              >
                {t("tabRegister")}
              </button>
            </div>

            {/* Modal Tab Body */}
            <div className="p-6">
              {citizenTab === "login" ? (
                /* LOGIN TAB */
                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-gray-700">
                      {t("phoneLabel")}
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                      <input
                        type="text"
                        value={loginPhone}
                        onChange={(e) => setLoginPhone(e.target.value)}
                        placeholder="+91 98765-XXXXX"
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-300 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold text-gray-700">
                        {t("otpLabel")}
                      </label>
                      <span className="text-[11px] text-emerald-700 font-bold font-mono">
                        {t("otpMockText")}
                      </span>
                    </div>
                    <input
                      type="text"
                      value={loginOtp}
                      onChange={(e) => setLoginOtp(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-300 text-xs font-mono tracking-widest text-center font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      required
                    />
                  </div>

                  {/* Quick Preset Buttons */}
                  <div className="space-y-2 pt-1">
                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
                      {t("quickFarmers")}
                    </span>
                    <div className="grid grid-cols-1 gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setLoginPhone("+91 98765-43210");
                          setCitizenUser({
                            name: "रामेश्वर शर्मा (Rameshwar Sharma)",
                            nameEn: "Rameshwar Sharma",
                            phone: "+91 98765-43210",
                            aadhaarRef: "•••• •••• 9214",
                            citizenType: "farmer",
                            state: "Uttar Pradesh",
                            district: "Prayagraj",
                            tehsil: "Karchhana",
                            village: "Naini",
                            khasraNumber: "104",
                            kycVerified: true,
                          });
                        }}
                        className="p-2 rounded-lg bg-gray-50 hover:bg-emerald-50 border border-gray-200 hover:border-emerald-300 text-left text-xs transition-colors flex items-center justify-between"
                      >
                        <div>
                          <div className="font-bold text-gray-900">
                            {language === "hi" ? "🌾 रामेश्वर शर्मा (किसान - खसरा #104)" : "🌾 Rameshwar Sharma (Farmer - Khasra #104)"}
                          </div>
                          <div className="text-[11px] text-gray-500">Naini, Karchhana, Prayagraj • +91 98765-43210</div>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">
                          {language === "hi" ? "चुनें" : "Select"}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setLoginPhone("+91 94500-67890");
                          setCitizenUser({
                            name: "आलोक नाथ त्रिपाठी (Alok Nath Tripathi)",
                            nameEn: "Alok Nath Tripathi",
                            phone: "+91 94500-67890",
                            aadhaarRef: "•••• •••• 5512",
                            citizenType: "buyer",
                            state: "Uttar Pradesh",
                            district: "Prayagraj",
                            tehsil: "Sadar",
                            village: "Civil Lines",
                            khasraNumber: "",
                            kycVerified: true,
                          });
                        }}
                        className="p-2 rounded-lg bg-gray-50 hover:bg-emerald-50 border border-gray-200 hover:border-emerald-300 text-left text-xs transition-colors flex items-center justify-between"
                      >
                        <div>
                          <div className="font-bold text-gray-900">
                            {language === "hi" ? "👨‍💼 आलोक नाथ त्रिपाठी (भूमि क्रेता / नागरिक)" : "👨‍💼 Alok Nath Tripathi (Land Buyer / Citizen)"}
                          </div>
                          <div className="text-[11px] text-gray-500">Civil Lines, Sadar, Prayagraj • +91 94500-67890</div>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-bold">
                          {language === "hi" ? "चुनें" : "Select"}
                        </span>
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={authLoading}
                    className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors shadow-md flex items-center justify-center space-x-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>{authLoading ? "Processing..." : t("loginSubmit")}</span>
                  </button>
                </form>
              ) : (
                /* REGISTRATION TAB */
                <form onSubmit={handleRegisterSubmit} className="space-y-3.5 max-h-[60vh] overflow-y-auto pr-1">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold text-gray-700">
                        {t("nameLabel")}
                      </label>
                      <input
                        type="text"
                        value={regForm.name}
                        onChange={(e) => setRegForm({ ...regForm, name: e.target.value })}
                        placeholder={language === "hi" ? "उदा. रामेश्वर शर्मा" : "e.g. Rameshwar Sharma"}
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold text-gray-700">
                        {t("phoneLabel")} *
                      </label>
                      <input
                        type="text"
                        value={regForm.phone}
                        onChange={(e) => setRegForm({ ...regForm, phone: e.target.value })}
                        placeholder="+91 98XXXXXXXX"
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold text-gray-700">
                        {t("aadhaarLabel")}
                      </label>
                      <input
                        type="text"
                        value={regForm.aadhaarRef}
                        onChange={(e) => setRegForm({ ...regForm, aadhaarRef: e.target.value })}
                        placeholder="4829-1049-8821"
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold text-gray-700">
                        {t("roleLabel")}
                      </label>
                      <select
                        value={regForm.citizenType}
                        onChange={(e) => setRegForm({ ...regForm, citizenType: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
                      >
                        <option value="farmer">{t("farmerRole")}</option>
                        <option value="buyer">{t("buyerRole")}</option>
                        <option value="advocate">{t("advocateRole")}</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold text-gray-700">
                        {t("districtLabel")}
                      </label>
                      <select
                        value={regForm.district}
                        onChange={(e) => setRegForm({ ...regForm, district: e.target.value })}
                        className="w-full px-2 py-2 rounded-lg border border-gray-300 text-xs focus:outline-none bg-white"
                      >
                        <option value="Prayagraj">Prayagraj (प्रयागराज)</option>
                        <option value="Varanasi">Varanasi (वाराणसी)</option>
                        <option value="Lucknow">Lucknow (लखनऊ)</option>
                        <option value="Ayodhya">Ayodhya (अयोध्या)</option>
                        <option value="Gorakhpur">Gorakhpur (गोरखपुर)</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold text-gray-700">
                        {t("tehsilLabel")}
                      </label>
                      <select
                        value={regForm.tehsil}
                        onChange={(e) => setRegForm({ ...regForm, tehsil: e.target.value })}
                        className="w-full px-2 py-2 rounded-lg border border-gray-300 text-xs focus:outline-none bg-white"
                      >
                        <option value="Karchhana">Karchhana (करछना)</option>
                        <option value="Sadar">Sadar (सदर)</option>
                        <option value="Phulpur">Phulpur (फूलपुर)</option>
                        <option value="Soraon">Soraon (सोरांव)</option>
                        <option value="Bara">Bara (बारा)</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold text-gray-700">
                        {t("villageLabel")}
                      </label>
                      <input
                        type="text"
                        value={regForm.village}
                        onChange={(e) => setRegForm({ ...regForm, village: e.target.value })}
                        placeholder="Naini"
                        className="w-full px-2 py-2 rounded-lg border border-gray-300 text-xs focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-gray-700">
                      {t("khasraNumLabel")}
                    </label>
                    <input
                      type="text"
                      value={regForm.khasraNumber}
                      onChange={(e) => setRegForm({ ...regForm, khasraNumber: e.target.value })}
                      placeholder="e.g. 104, 105, 142/1"
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={authLoading}
                    className="w-full mt-2 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors shadow-md flex items-center justify-center space-x-2"
                  >
                    <Sparkles className="w-4 h-4 text-emerald-200" />
                    <span>{authLoading ? "Processing..." : t("registerSubmit")}</span>
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
