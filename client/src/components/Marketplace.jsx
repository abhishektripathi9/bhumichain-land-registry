import React, { useState, useEffect } from "react";
import {
  Search,
  MapPin,
  CheckCircle,
  Tag,
  DollarSign,
  Phone,
  User,
  PlusCircle,
  ExternalLink,
  FileText,
  Compass,
  ArrowRight,
  ShieldCheck,
  Check,
  X,
  AlertCircle,
  Share2,
} from "lucide-react";
import { useLanguage } from "../context/LanguageContext";

export default function Marketplace({ onInspectOnMap, onOpenKhatauni }) {
  const { language } = useLanguage();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("All");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBuyModal, setShowBuyModal] = useState(null); // holds listing to buy
  const [purchaseSuccess, setPurchaseSuccess] = useState(null); // holds purchase result

  // Add Land Form State
  const [formData, setFormData] = useState({
    district: "Chitrakoot",
    tehsil: "Rajapur",
    block: "Ramnagar",
    village: "Ramnagar",
    khasraNumber: "",
    khataNumber: "",
    areaBigha: 2.0,
    landType: "कृषि भूमि (दोमट उपजाऊ)",
    askingPriceInr: "",
    pricePerBighaInr: "",
    ownerName: "",
    ownerFather: "",
    ownerPhone: "",
    title: "",
    features: "चक मार्ग 4 मीटर, नहरी सिंचाई, पक्का मेड़",
  });
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  // Buy Form State
  const [buyerName, setBuyerName] = useState("");
  const [buyerFather, setBuyerFather] = useState("");
  const [buyerPhone, setBuyerPhone] = useState("");
  const [buySubmitting, setBuySubmitting] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

  // Fetch listings from API
  const fetchListings = () => {
    setLoading(true);
    fetch(`${API_URL}/api/marketplace/listings`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success && Array.isArray(data.listings)) {
          setListings(data.listings);
        }
      })
      .catch((err) => console.warn("Notice loading marketplace:", err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchListings();
  }, []);

  // Filter listings
  const filteredListings = listings.filter((item) => {
    const matchDistrict = selectedDistrict === "All" || item.district.toLowerCase() === selectedDistrict.toLowerCase();
    const q = searchQuery.toLowerCase().trim();
    const matchQuery =
      !q ||
      item.village.toLowerCase().includes(q) ||
      item.khasraNumber.includes(q) ||
      item.district.toLowerCase().includes(q) ||
      item.title.toLowerCase().includes(q) ||
      item.ownerName.toLowerCase().includes(q);
    return matchDistrict && matchQuery;
  });

  // Handle Add Form Submit
  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setFormSubmitting(true);
    setFormError("");

    try {
      const payload = {
        ...formData,
        askingPriceInr: parseInt(formData.askingPriceInr),
        pricePerBighaInr: formData.pricePerBighaInr ? parseInt(formData.pricePerBighaInr) : Math.round(parseInt(formData.askingPriceInr) / parseFloat(formData.areaBigha)),
        areaBigha: parseFloat(formData.areaBigha),
        features: formData.features.split(",").map((s) => s.trim()).filter(Boolean),
      };

      const res = await fetch(`${API_URL}/api/marketplace/list-for-sale`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        setShowAddModal(false);
        fetchListings();
        // Reset form
        setFormData({
          district: "Chitrakoot",
          tehsil: "Rajapur",
          block: "Ramnagar",
          village: "Ramnagar",
          khasraNumber: "",
          khataNumber: "",
          areaBigha: 2.0,
          landType: "कृषि भूमि (दोमट उपजाऊ)",
          askingPriceInr: "",
          pricePerBighaInr: "",
          ownerName: "",
          ownerFather: "",
          ownerPhone: "",
          title: "",
          features: "चक मार्ग 4 मीटर, नहरी सिंचाई, पक्का मेड़",
        });
      } else {
        setFormError(data.message || "खेत बिक्री हेतु जोड़ने में त्रुटि।");
      }
    } catch (err) {
      setFormError("सर्वर से संपर्क करने में असमर्थ। कृपया पुनः प्रयास करें।");
    } finally {
      setFormSubmitting(false);
    }
  };

  // Handle Buy Submit
  const handleBuySubmit = async (e) => {
    e.preventDefault();
    if (!showBuyModal || !buyerName.trim()) return;
    setBuySubmitting(true);

    try {
      const res = await fetch(`${API_URL}/api/marketplace/complete-purchase`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingId: showBuyModal.id,
          buyerName: buyerName.trim(),
          buyerFather: buyerFather.trim() || "आत्मज",
          buyerPhone: buyerPhone.trim(),
          salePrice: showBuyModal.askingPriceInr,
          paymentMode: "TREASURY_ESCROW_VERIFIED",
        }),
      });

      const data = await res.json();
      if (data.success) {
        setPurchaseSuccess(data);
        setShowBuyModal(null);
        fetchListings();
      } else {
        alert(data.message || "क्रय प्रक्रिया पूर्ण नहीं हो सकी।");
      }
    } catch (err) {
      alert("तकनीकी त्रुटि। कृपया पुनः प्रयास करें।");
    } finally {
      setBuySubmitting(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 text-slate-900 pb-16">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white px-4 sm:px-8 py-8 shadow-md">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30 mb-2">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>प्रत्यक्ष काश्तकार-से-क्रेता भू-बाजार (Direct Owner-to-Buyer Marketplace)</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              खेत खरीदें और बेचें • उत्तर प्रदेश (Buy & Sell Land)
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-2xl">
              बिना किसी दलाल या बिचौलिए के सीधे सत्यापित भू-स्वामियों से खेत खरीदें। हर खेत 100% सरकारी भूलेख, 3-लेयर डाक पिनकोड और स्वच्छ मालिकाना इतिहास से प्रमाणित है।
            </p>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-bold shadow-lg transition-transform active:scale-95 flex-shrink-0 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>अपना खेत बिक्री के लिए जोड़ें (List Land)</span>
          </button>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-6 space-y-6">
        {/* Search & Filter Bar */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="गाँव, गाटा सं., काश्तकार का नाम या जिला खोजें..."
              className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
            />
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <span className="text-xs font-bold text-slate-500 whitespace-nowrap">जनपद:</span>
            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              className="px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
            >
              <option value="All">समस्त 75 जनपद (All UP)</option>
              <option value="Chitrakoot">चित्रकूट (Chitrakoot)</option>
              <option value="Banda">बांदा (Banda)</option>
              <option value="Prayagraj">प्रयागराज (Prayagraj)</option>
              <option value="Lucknow">लखनऊ (Lucknow)</option>
              <option value="Ayodhya">अयोध्या (Ayodhya)</option>
              <option value="Varanasi">वाराणसी (Varanasi)</option>
            </select>
          </div>
        </div>

        {/* Listings Grid */}
        {loading ? (
          <div className="p-12 text-center text-slate-500 space-y-2">
            <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs font-semibold">सत्यापित भू-अभिलेख व खेत बाजार लोड हो रहा है...</p>
          </div>
        ) : filteredListings.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 space-y-3">
            <AlertCircle className="w-10 h-10 text-slate-400 mx-auto" />
            <h3 className="text-base font-bold text-slate-800">कोई खेत नहीं मिला</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              इस खोज या जनपद में अभी कोई खेत बिक्री हेतु उपलब्ध नहीं है। आप ऊपर बटन से अपना खेत बिक्री के लिए जोड़ सकते हैं।
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-5">
            {filteredListings.map((item) => {
              const isAvailable = item.status === "AVAILABLE";
              return (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow overflow-hidden flex flex-col justify-between"
                >
                  <div className="p-5 space-y-3">
                    {/* Header Row */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="px-2 py-0.5 rounded bg-emerald-800 text-white font-mono text-[11px] font-bold">
                            गाटा #{item.khasraNumber}
                          </span>
                          <span className="text-[10px] font-semibold text-slate-500">
                            खाता सं. {item.khataNumber}
                          </span>
                          {isAvailable ? (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px] flex items-center space-x-1">
                              <CheckCircle className="w-3 h-3 text-emerald-600" />
                              <span>बिक्री हेतु उपलब्ध</span>
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-bold text-[10px]">
                              ✓ रजिस्ट्री पूर्ण (SOLD)
                            </span>
                          )}
                        </div>
                        <h3 className="text-base font-black text-slate-900 mt-1">
                          {item.title}
                        </h3>
                        <p className="text-xs text-slate-500 flex items-center space-x-1 mt-0.5">
                          <MapPin className="w-3.5 h-3.5 text-rose-500 flex-shrink-0" />
                          <span>
                            ग्राम {item.village}, विकास खंड {item.block}, {item.tehsil}, {item.district} • पिन: <strong className="text-emerald-700 font-mono">{item.pincode}</strong> ({item.postOffice})
                          </span>
                        </p>
                      </div>

                      {/* Price Badge */}
                      <div className="text-right flex-shrink-0">
                        <span className="text-xs text-slate-400 block font-medium">कुल मूल्य</span>
                        <span className="text-lg font-black text-emerald-700">
                          ₹{item.askingPriceInr.toLocaleString("en-IN")}
                        </span>
                        <span className="text-[10px] font-bold text-slate-500 block">
                          ₹{Math.round(item.pricePerBighaInr).toLocaleString("en-IN")} / बीघा
                        </span>
                      </div>
                    </div>

                    {/* 3 Metric Pills */}
                    <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-center text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">रकबा (क्षेत्रफल)</span>
                        <span className="font-extrabold text-slate-900">
                          {item.areaBigha} पक्का बीघा
                        </span>
                        <span className="text-[9.5px] text-slate-500 block font-mono">
                          {item.areaBiswa} बिस्वा ({item.areaHectare} हे.)
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">भूमि प्रकृति</span>
                        <span className="font-bold text-slate-900 truncate block">
                          {item.landType}
                        </span>
                        <span className="text-[9.5px] text-emerald-700 font-semibold block">
                          संक्राम्य भूमिधर
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">कानूनी स्थिति</span>
                        <span className="font-bold text-emerald-800 text-[11px] block">
                          ✓ स्वच्छ व विवाद-मुक्त
                        </span>
                        <span className="text-[9.5px] text-slate-500 block font-mono">
                          0 ऋण • 0 दीवानी वाद
                        </span>
                      </div>
                    </div>

                    {/* Features row */}
                    {item.features && item.features.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {item.features.map((f, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded-md bg-stone-100 text-stone-700 text-[10px] font-medium border border-stone-200"
                          >
                            ✓ {f}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Owner Card */}
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200/80 text-xs">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 rounded-full bg-emerald-700 text-white flex items-center justify-center font-bold text-xs">
                          {item.ownerName.slice(0, 1)}
                        </div>
                        <div>
                          <span className="font-bold text-slate-900 block">{item.ownerName}</span>
                          <span className="text-[10px] text-slate-500">{item.ownerFather} (पंजीकृत काश्तकार)</span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-1.5">
                        <a
                          href={`tel:${item.ownerPhone}`}
                          className="px-3 py-1.5 rounded-lg bg-white border border-emerald-300 text-emerald-800 text-xs font-bold flex items-center space-x-1 hover:bg-emerald-100 transition-colors"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          <span>{item.ownerPhone}</span>
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons Footer */}
                  <div className="bg-slate-50 border-t border-slate-200 p-3 px-5 flex items-center justify-between gap-2">
                    <button
                      onClick={() => onInspectOnMap && onInspectOnMap(item)}
                      className="px-3 py-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 text-xs font-bold flex items-center space-x-1.5 transition-colors cursor-pointer"
                    >
                      <Compass className="w-3.5 h-3.5 text-slate-600" />
                      <span>नक्शे पर देखें (View on Map)</span>
                    </button>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => onOpenKhatauni && onOpenKhatauni(item)}
                        className="px-3 py-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 text-xs font-bold flex items-center space-x-1.5 transition-colors cursor-pointer"
                        title="पूरी 13-कॉलम खतौनी नकल देखें"
                      >
                        <FileText className="w-3.5 h-3.5 text-emerald-700" />
                        <span className="hidden sm:inline">खतौनी नकल</span>
                      </button>

                      {isAvailable ? (
                        <button
                          onClick={() => {
                            setShowBuyModal(item);
                            setBuyerName("");
                            setBuyerFather("");
                            setBuyerPhone("");
                          }}
                          className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold flex items-center space-x-1.5 shadow-sm transition-transform active:scale-95 cursor-pointer"
                        >
                          <ShieldCheck className="w-4 h-4 text-emerald-200" />
                          <span>मालिक से खरीदें (Buy Land)</span>
                        </button>
                      ) : (
                        <span className="px-3 py-1.5 rounded-lg bg-slate-200 text-slate-600 text-xs font-bold">
                          विक्रय पूर्ण
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ================= MODAL 1: ADD LAND FOR SALE ================= */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center space-x-2">
                <PlusCircle className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-black text-slate-900">
                  अपना खेत बिक्री हेतु जोड़ें (List Land For Sale)
                </h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold">
                ⚠️ {formError}
              </div>
            )}

            <form onSubmit={handleAddSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">जनपद (District) *</label>
                  <select
                    value={formData.district}
                    onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-medium"
                  >
                    <option value="Chitrakoot">चित्रकूट (Chitrakoot)</option>
                    <option value="Banda">बांदा (Banda)</option>
                    <option value="Prayagraj">प्रयागराज (Prayagraj)</option>
                    <option value="Lucknow">लखनऊ (Lucknow)</option>
                    <option value="Ayodhya">अयोध्या (Ayodhya)</option>
                    <option value="Varanasi">वाराणसी (Varanasi)</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">तहसील (Tehsil) *</label>
                  <input
                    type="text"
                    value={formData.tehsil}
                    onChange={(e) => setFormData({ ...formData, tehsil: e.target.value })}
                    required
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">विकास खंड (Block)</label>
                  <input
                    type="text"
                    value={formData.block}
                    onChange={(e) => setFormData({ ...formData, block: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-medium"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">ग्राम / गाँव (Village) *</label>
                  <input
                    type="text"
                    value={formData.village}
                    onChange={(e) => setFormData({ ...formData, village: e.target.value })}
                    required
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">गाटा / खसरा संख्या *</label>
                  <input
                    type="text"
                    value={formData.khasraNumber}
                    onChange={(e) => setFormData({ ...formData, khasraNumber: e.target.value })}
                    required
                    placeholder="उदा. 104"
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">खाता संख्या</label>
                  <input
                    type="text"
                    value={formData.khataNumber}
                    onChange={(e) => setFormData({ ...formData, khataNumber: e.target.value })}
                    placeholder="उदा. 00104"
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">रकबा (पक्का बीघा) *</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.areaBigha}
                    onChange={(e) => setFormData({ ...formData, areaBigha: e.target.value })}
                    required
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-bold"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">भूमि का प्रकार</label>
                  <input
                    type="text"
                    value={formData.landType}
                    onChange={(e) => setFormData({ ...formData, landType: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">मांग मूल्य (कुल कीमत ₹) *</label>
                  <input
                    type="number"
                    value={formData.askingPriceInr}
                    onChange={(e) => setFormData({ ...formData, askingPriceInr: e.target.value })}
                    required
                    placeholder="उदा. 2500000"
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-bold text-emerald-800"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">प्रति बीघा दर (₹)</label>
                  <input
                    type="number"
                    value={formData.pricePerBighaInr}
                    onChange={(e) => setFormData({ ...formData, pricePerBighaInr: e.target.value })}
                    placeholder="स्वतः गणना या दर्ज करें"
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">काश्तकार का नाम *</label>
                  <input
                    type="text"
                    value={formData.ownerName}
                    onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                    required
                    placeholder="उदा. राम प्रकाश यादव"
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-medium"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">मोबाइल नंबर *</label>
                  <input
                    type="tel"
                    value={formData.ownerPhone}
                    onChange={(e) => setFormData({ ...formData, ownerPhone: e.target.value })}
                    required
                    placeholder="+91 94150 00000"
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">विशेष सुविधाएं (चक मार्ग, पानी आदि)</label>
                <input
                  type="text"
                  value={formData.features}
                  onChange={(e) => setFormData({ ...formData, features: e.target.value })}
                  placeholder="अल्पविराम (comma) से अलग करें"
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-medium"
                />
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 cursor-pointer"
                >
                  रद्द करें
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-5 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white font-bold cursor-pointer disabled:opacity-50"
                >
                  {formSubmitting ? "सत्यापित किया जा रहा है..." : "खेत बिक्री हेतु प्रकाशित करें"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL 2: BUY LAND DIRECTLY ================= */}
      {showBuyModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-black text-slate-900">
                  सीधे मालिक से खेत खरीदें (Direct Purchase)
                </h3>
              </div>
              <button
                onClick={() => setShowBuyModal(null)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Plot Summary */}
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 space-y-1 text-xs">
              <div className="flex justify-between font-black text-slate-900">
                <span>गाटा सं. #{showBuyModal.khasraNumber} • ग्राम {showBuyModal.village}</span>
                <span className="text-emerald-800">₹{showBuyModal.askingPriceInr.toLocaleString("en-IN")}</span>
              </div>
              <div className="text-slate-600">
                रकबा: <strong className="text-slate-900">{showBuyModal.areaBigha} बीघा</strong> ({showBuyModal.areaSqFt?.toLocaleString("en-IN")} वर्ग फीट) • पिन: <strong className="text-emerald-700 font-mono">{showBuyModal.pincode}</strong>
              </div>
              <div className="text-[11px] text-slate-500">
                वर्तमान विक्रेता: <strong className="text-slate-800">{showBuyModal.ownerName}</strong> ({showBuyModal.ownerFather})
              </div>
            </div>

            <form onSubmit={handleBuySubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">क्रेता का पूरा नाम (Buyer Name) *</label>
                <input
                  type="text"
                  value={buyerName}
                  onChange={(e) => setBuyerName(e.target.value)}
                  required
                  placeholder="अपना नाम दर्ज करें"
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-bold"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">पिता / पति का नाम (Father's Name) *</label>
                <input
                  type="text"
                  value={buyerFather}
                  onChange={(e) => setBuyerFather(e.target.value)}
                  required
                  placeholder="पिता या पति का नाम"
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-medium"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">मोबाइल नंबर (Phone) *</label>
                <input
                  type="tel"
                  value={buyerPhone}
                  onChange={(e) => setBuyerPhone(e.target.value)}
                  required
                  placeholder="+91 98765 43210"
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono"
                />
              </div>

              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px] space-y-1">
                <div className="font-bold flex items-center space-x-1">
                  <span>⚖ उ.प्र. राजस्व संहिता नियम:</span>
                </div>
                <p>
                  क्रय की पुष्टि होते ही विक्रेता का नाम स्वतः <strong>पूर्व मालिक (Past Owners)</strong> में अभिलेखित होगा, तथा क्रेता को नवीन प्रमाणित <strong>e-Khatauni व QR प्रमाण पत्र</strong> तत्काल जारी होगा।
                </p>
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowBuyModal(null)}
                  className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 cursor-pointer"
                >
                  रद्द करें
                </button>
                <button
                  type="submit"
                  disabled={buySubmitting}
                  className="px-5 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white font-bold cursor-pointer disabled:opacity-50"
                >
                  {buySubmitting ? "रजिस्ट्री की जा रही है..." : "रजिस्ट्री पूर्ण करें (Confirm Purchase)"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL 3: PURCHASE SUCCESS & DIGITAL CERTIFICATE ================= */}
      {purchaseSuccess && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-emerald-300">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <Check className="w-8 h-8 stroke-[3]" />
              </div>
              <h3 className="text-lg font-black text-slate-900">
                बधाई! भूमि बैनामा व रजिस्ट्री सफलतापूर्वक सम्पन्न हुई
              </h3>
              <p className="text-xs text-slate-600 max-w-sm mx-auto">
                {purchaseSuccess.message}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500 font-bold">डिजिटल प्रमाण पत्र सं.:</span>
                <span className="font-mono font-bold text-emerald-800">
                  {purchaseSuccess.certificateId}
                </span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500 font-bold">नवीन वर्तमान मालिक:</span>
                <span className="font-bold text-slate-900">
                  {purchaseSuccess.newOwner?.ownerName}
                </span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500 font-bold">पूर्व मालिक (Past Owner):</span>
                <span className="font-medium text-slate-700">
                  {purchaseSuccess.listing?.ownerName} (अभिलेखित)
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-bold">भूमि विवरण:</span>
                <span className="font-bold text-slate-900">
                  गाटा #{purchaseSuccess.listing?.khasraNumber}, ग्राम {purchaseSuccess.listing?.village} ({purchaseSuccess.listing?.district})
                </span>
              </div>
            </div>

            <div className="pt-2 flex items-center space-x-2">
              <button
                onClick={() => {
                  setPurchaseSuccess(null);
                  if (onInspectOnMap) onInspectOnMap(purchaseSuccess.listing);
                }}
                className="flex-1 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs shadow-md transition-colors cursor-pointer text-center"
              >
                नक्शे पर अपनी जमीन देखें (View on Map)
              </button>
              <button
                onClick={() => setPurchaseSuccess(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs cursor-pointer"
              >
                बंद करें
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
