import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import { useWeb3 } from "../context/Web3Context";
import { getApiUrl, API_BASE_URL } from "../utils/apiConfig";
import {
  Building,
  Tag,
  MessageSquare,
  AlertTriangle,
  CheckCircle,
  Clock,
  Layers,
  Lock,
  ExternalLink,
  ShieldCheck,
  Eye,
  EyeOff,
  UserCheck,
  Plus,
  Trash2,
  Shield,
} from "lucide-react";

export default function MyProperties({ onSelectParcel, onOpenChat }) {
  const { account, contract, signer, connectWallet, demoAccounts } = useWeb3();
  const [properties, setProperties] = useState([]);
  const [escrowDeals, setEscrowDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingParcel, setEditingParcel] = useState(null);
  const [newPrice, setNewPrice] = useState("1.50");
  const [actionLoading, setActionLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");

  // Privacy & Access Control Modal State ("किसको-किसको देखना है")
  const [privacyModalParcel, setPrivacyModalParcel] = useState(null);
  const [selectedVisibility, setSelectedVisibility] = useState("PUBLIC");
  const [whitelistWallets, setWhitelistWallets] = useState([]);
  const [newWalletInput, setNewWalletInput] = useState("");
  const [savingPrivacy, setSavingPrivacy] = useState(false);

  const apiUrl = API_BASE_URL;

  const fetchMyData = () => {
    if (!account) {
      setLoading(false);
      return;
    }
    setLoading(true);

    Promise.all([
      fetch(getApiUrl(`properties?ownerWallet=${account.toLowerCase()}`)).then((r) => r.json()),
      fetch(getApiUrl("admin/escrow-deals")).then((r) => r.json()),
    ])
      .then(([propData, dealData]) => {
        if (propData.success && propData.properties) {
          setProperties(propData.properties);
        }
        if (dealData.success && dealData.deals) {
          const myDeals = dealData.deals.filter(
            (d) =>
              d.buyerWallet?.toLowerCase() === account.toLowerCase() ||
              d.sellerWallet?.toLowerCase() === account.toLowerCase()
          );
          setEscrowDeals(myDeals);
        }
      })
      .catch((err) => console.warn("Error loading properties:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchMyData();
  }, [account]);

  // Open Privacy Modal
  const handleOpenPrivacyModal = (p) => {
    setPrivacyModalParcel(p);
    setSelectedVisibility(p.visibilityMode || "PUBLIC");
    setWhitelistWallets(p.allowedViewers || []);
    setNewWalletInput("");
  };

  // Add Wallet to Whitelist
  const handleAddWhitelistWallet = (walletToAdd) => {
    const target = walletToAdd || newWalletInput.trim();
    if (!target) return;
    if (!ethers.isAddress(target)) {
      alert("Please enter a valid Ethereum address (0x...)");
      return;
    }
    if (!whitelistWallets.includes(target.toLowerCase())) {
      setWhitelistWallets([...whitelistWallets, target.toLowerCase()]);
    }
    setNewWalletInput("");
  };

  // Remove Wallet from Whitelist
  const handleRemoveWhitelistWallet = (addr) => {
    setWhitelistWallets(whitelistWallets.filter((w) => w.toLowerCase() !== addr.toLowerCase()));
  };

  // Save Privacy Settings to Backend
  const handleSavePrivacy = async () => {
    if (!privacyModalParcel) return;
    setSavingPrivacy(true);
    setStatusMsg("");

    try {
      const res = await fetch(getApiUrl(`properties/${privacyModalParcel._id}/privacy`), {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-wallet-address": account,
        },
        body: JSON.stringify({
          visibilityMode: selectedVisibility,
          allowedViewers: whitelistWallets,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setStatusMsg(
          `Security permissions updated! Parcel Khasra #${privacyModalParcel.khasraNumber} visibility set to ${selectedVisibility}.`
        );
        setPrivacyModalParcel(null);
        fetchMyData();
      } else {
        alert(data.message || "Failed to save privacy settings.");
      }
    } catch (err) {
      console.error("Privacy update error:", err);
      alert("Network error updating viewing permissions.");
    } finally {
      setSavingPrivacy(false);
    }
  };

  // Handle Toggle For Sale on-chain
  const handleToggleForSale = async (parcel) => {
    if (!contract || !signer) {
      alert("Please connect your Web3 wallet.");
      return;
    }

    setActionLoading(true);
    setStatusMsg("");

    try {
      const priceInWei = ethers.parseEther(newPrice.toString());
      console.log(`Toggling sale status for Land ID ${parcel.onChainId} with price ${newPrice} ETH`);

      if (parcel.onChainId) {
        const tx = await contract.toggleForSale(parcel.onChainId, priceInWei);
        await tx.wait();
      }

      await fetch(getApiUrl(`properties/${parcel._id}/sale`), {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-wallet-address": account,
        },
        body: JSON.stringify({
          isForSale: !parcel.isForSale,
          price: newPrice.toString(),
        }),
      });

      setStatusMsg(`Parcel Khasra #${parcel.khasraNumber} status successfully updated!`);
      setEditingParcel(null);
      fetchMyData();
    } catch (err) {
      console.error("Toggle sale error:", err);
      setStatusMsg(err.reason || err.message || "Failed to update listing status on-chain.");
    } finally {
      setActionLoading(false);
    }
  };

  if (!account) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="p-10 rounded-2xl bg-white border border-gray-200 shadow-sm space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 mx-auto">
            <Building className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-black text-gray-900">अपना खाता चुनें और अपने नाम दर्ज जमीन देखें</h2>
          <p className="text-xs text-gray-500 max-w-md mx-auto">
            अपने प्रमाणित खाते से अपने नाम दर्ज खेत, खतौनी विवरण एवं भू-नक्शा देखें।
          </p>
          <button
            onClick={connectWallet}
            className="px-6 py-2.5 rounded-xl bg-[#059669] hover:bg-[#047857] font-bold text-xs text-white shadow-md transition-colors"
          >
            Connect MetaMask Wallet
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8 animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
              <Building className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-black text-gray-900 tracking-tight">
              My Cadastral Holdings & Security Privacy
            </h1>
          </div>
          <p className="text-xs text-gray-500 mt-1 font-mono">
            प्रमाणित नागरिक खाता: {account}
          </p>
        </div>

        <button
          onClick={fetchMyData}
          className="px-4 py-2 rounded-xl bg-white hover:bg-gray-50 text-xs font-semibold text-gray-700 border border-gray-300 shadow-2xs transition-colors"
        >
          अभिलेख ताज़ा करें
        </button>
      </div>

      {statusMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
          {statusMsg}
        </div>
      )}

      {/* Properties List */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-gray-600">
            Registered Cadastral Parcels ({properties.length})
          </h2>
        </div>

        {loading ? (
          <div className="py-12 text-center text-gray-400 text-xs animate-pulse font-medium">
            प्रमाणित राजस्व अभिलेख खोजे जा रहे हैं...
          </div>
        ) : properties.length === 0 ? (
          <div className="p-10 rounded-2xl bg-white border border-gray-200 text-center text-gray-500 text-xs space-y-3 shadow-2xs">
            <p className="font-semibold text-gray-700">No land parcels registered to this wallet address yet.</p>
            <p className="text-gray-400">
              Use "Register Land" to plot a new parcel or switch wallet to Rameshwar Sharma / Rajesh Kumar Verma.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.map((p) => {
              const currentVis = p.visibilityMode || "PUBLIC";
              return (
                <div
                  key={p._id}
                  className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:border-gray-300 transition-all space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-black text-base text-gray-900">
                        Khasra #{p.khasraNumber}
                      </span>
                      <div className="flex items-center space-x-1.5">
                        {/* Visibility Pill */}
                        <span
                          className={`text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center space-x-1 ${
                            currentVis === "CONFIDENTIAL"
                              ? "bg-rose-50 text-rose-700 border border-rose-200"
                              : currentVis === "RESTRICTED"
                              ? "bg-amber-50 text-amber-700 border border-amber-200"
                              : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          }`}
                        >
                          {currentVis === "CONFIDENTIAL" ? (
                            <EyeOff className="w-2.5 h-2.5 inline" />
                          ) : currentVis === "RESTRICTED" ? (
                            <Lock className="w-2.5 h-2.5 inline" />
                          ) : (
                            <Eye className="w-2.5 h-2.5 inline" />
                          )}
                          <span>{currentVis}</span>
                        </span>

                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            p.disputeStatus
                              ? "bg-rose-50 text-rose-700 border border-rose-200"
                              : p.status === "Verified"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-amber-50 text-amber-700 border border-amber-200"
                          }`}
                        >
                          {p.disputeStatus ? "Disputed" : p.status}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-gray-500">
                      {p.village}, Tehsil {p.tehsil}, {p.district}
                    </p>

                    <div className="grid grid-cols-2 gap-2 text-xs py-2 border-y border-gray-100 font-medium">
                      <div>
                        <span className="text-[10px] text-gray-400 uppercase font-bold block">Area</span>
                        <p className="font-semibold text-gray-800">
                          {p.areaSqFt ? p.areaSqFt.toLocaleString() : p.area} sq.ft
                        </p>
                      </div>
                      <div>
                        <span className="text-[10px] text-gray-400 uppercase font-bold block">Escrow Valuation</span>
                        <p className="font-semibold text-emerald-700 font-mono">{p.price} ETH</p>
                      </div>
                    </div>

                    {p.isForSale ? (
                      <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between font-medium">
                        <span className="font-bold flex items-center space-x-1">
                          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                          <span>ऑनलाइन पंजीकृत</span>
                        </span>
                        <span className="font-mono font-bold">{p.price} ETH</span>
                      </div>
                    ) : (
                      <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-500 text-xs font-medium">
                        Private Possession (Not Listed)
                      </div>
                    )}
                  </div>

                  {/* Actions & Permissions */}
                  <div className="pt-3 border-t border-gray-100 space-y-2">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          setEditingParcel(p);
                          setNewPrice(p.price || "1.50");
                        }}
                        disabled={p.disputeStatus || p.status !== "Verified"}
                        className="flex-1 py-2 px-3 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-40 text-xs font-bold text-gray-800 transition-colors flex items-center justify-center space-x-1.5"
                      >
                        <Tag className="w-3.5 h-3.5" />
                        <span>{p.isForSale ? "Update Price / Delist" : "List for Sale"}</span>
                      </button>

                      <button
                        onClick={() => onOpenChat(p)}
                        className="p-2 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 transition-colors"
                        title="Open Buyer Messages"
                      >
                        <MessageSquare className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => onSelectParcel(p)}
                        className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
                        title="View on Cadastral Map"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </button>
                    </div>

                    {/* OWNER PERMISSIONS BUTTON ("किसको-किसको देखना है") */}
                    <button
                      onClick={() => handleOpenPrivacyModal(p)}
                      className="w-full py-2 px-3 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold transition-colors flex items-center justify-center space-x-2 shadow-2xs"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Set Privacy & Whitelist (किसको-किसको देखना है)</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Active Escrow Purchases / Deals */}
      <div className="pt-4 border-t border-gray-200">
        <h2 className="text-xs font-bold uppercase tracking-wider text-gray-600 mb-4 flex items-center space-x-2">
          <Lock className="w-4 h-4 text-emerald-600" />
          <span>Active Escrow Deals ({escrowDeals.length})</span>
        </h2>

        {escrowDeals.length === 0 ? (
          <div className="p-6 rounded-2xl bg-white border border-gray-200 text-center text-xs text-gray-400 shadow-2xs">
            No active escrow transactions in progress for this wallet.
          </div>
        ) : (
          <div className="space-y-3">
            {escrowDeals.map((deal, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl bg-white border border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-2xs"
              >
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-gray-900">
                      Escrow Deal for Land #{deal.onChainId}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-bold">
                      {deal.escrowStatus}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-500 mt-1 font-mono">
                    Buyer: {deal.buyerWallet?.slice(0, 8)}... | Seller: {deal.sellerWallet?.slice(0, 8)}...
                  </p>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <span className="text-xs font-bold text-emerald-700">{deal.amount} ETH</span>
                    <p className="text-[10px] text-gray-400">10% डिजिटल बयाना सुरक्षित</p>
                  </div>
                  <span className="text-xs px-3 py-1.5 rounded-lg bg-gray-100 text-gray-700 border border-gray-200 font-medium">
                    Awaiting Registrar Approval
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ===================================================================== */}
      {/* OWNER PRIVACY & PERMISSIONS MODAL ("किसको-किसको देखना है")            */}
      {/* ===================================================================== */}
      {privacyModalParcel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg bg-white rounded-3xl p-6 shadow-2xl space-y-5 border border-gray-200 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-gray-100 pb-3">
              <div>
                <div className="flex items-center space-x-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  <h3 className="text-base font-black text-gray-900">
                    Proprietor Privacy & Viewing Permissions
                  </h3>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  Set who is authorized to view Khasra #{privacyModalParcel.khasraNumber} ({privacyModalParcel.village})
                </p>
              </div>
              <button
                onClick={() => setPrivacyModalParcel(null)}
                className="text-gray-400 hover:text-gray-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {/* Visibility Mode Selector */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700">
                1. Select Title Visibility Level:
              </label>

              <div className="grid grid-cols-1 gap-2.5">
                {[
                  {
                    id: "PUBLIC",
                    title: "🌐 Public Cadastre (Unrestricted)",
                    desc: "Visible to all citizens on the map; certified deed, circle rate & escrow purchase open to public.",
                    badge: "Open to All",
                    color: "emerald",
                  },
                  {
                    id: "RESTRICTED",
                    title: "🛡️ Whitelisted Buyer Wallets Only",
                    desc: "Only wallets explicitly permitted by you below can inspect certified title deed & survey coordinates.",
                    badge: "Selective Whitelist",
                    color: "amber",
                  },
                  {
                    id: "CONFIDENTIAL",
                    title: "🔒 Confidential / Off-Market",
                    desc: "Hidden from general public map explorer; strictly visible only to you (owner) and Sub-Registrars.",
                    badge: "Private Title",
                    color: "rose",
                  },
                ].map((mode) => (
                  <div
                    key={mode.id}
                    onClick={() => setSelectedVisibility(mode.id)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                      selectedVisibility === mode.id
                        ? "bg-emerald-50/60 border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs"
                        : "bg-white border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-900">{mode.title}</span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-gray-100 text-gray-700">
                        {mode.badge}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">{mode.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Whitelist Manager (Only active if RESTRICTED or CONFIDENTIAL) */}
            {selectedVisibility !== "PUBLIC" && (
              <div className="space-y-3 p-4 rounded-2xl bg-gray-50 border border-gray-200">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-700 flex items-center space-x-1.5">
                    <UserCheck className="w-4 h-4 text-emerald-600" />
                    <span>2. Permitted Buyer / Lawyer Wallets ({whitelistWallets.length}):</span>
                  </label>
                  <span className="text-[10px] text-gray-400 font-mono">Whitelisted Wallets</span>
                </div>

                {/* Input to add wallet */}
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={newWalletInput}
                    onChange={(e) => setNewWalletInput(e.target.value)}
                    placeholder="Enter Ethereum wallet address (0x...)"
                    className="flex-1 bg-white border border-gray-300 rounded-xl px-3 py-2 text-xs text-gray-900 font-mono focus:outline-none focus:border-emerald-600"
                  />
                  <button
                    onClick={() => handleAddWhitelistWallet()}
                    className="px-3.5 py-2 rounded-xl bg-black hover:bg-gray-800 text-white font-bold text-xs flex items-center space-x-1 shadow-2xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add</span>
                  </button>
                </div>

                {/* Quick Add Demo Accounts */}
                <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-gray-500 pt-1">
                  <span className="font-bold text-gray-400">Quick Whitelist:</span>
                  <button
                    onClick={() =>
                      handleAddWhitelistWallet("0x15d34aaf54267db7d7c367839aaf71a00a2c6a65")
                    }
                    className="px-2 py-0.5 rounded bg-white border border-gray-200 hover:bg-emerald-50 text-emerald-700 font-mono font-semibold"
                  >
                    + Amit Saxena (Buyer)
                  </button>
                  <button
                    onClick={() =>
                      handleAddWhitelistWallet("0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC")
                    }
                    className="px-2 py-0.5 rounded bg-white border border-gray-200 hover:bg-emerald-50 text-emerald-700 font-mono font-semibold"
                  >
                    + Rajesh Verma
                  </button>
                </div>

                {/* List of Whitelisted Wallets */}
                <div className="space-y-1.5 max-h-36 overflow-y-auto pt-2">
                  {whitelistWallets.length === 0 ? (
                    <p className="text-[11px] text-gray-400 italic">
                      No external wallets whitelisted yet. Only the owner & Sub-Registrar can view.
                    </p>
                  ) : (
                    whitelistWallets.map((addr, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2 rounded-lg bg-white border border-gray-200 text-xs font-mono"
                      >
                        <span className="text-gray-800 font-medium truncate pr-2">{addr}</span>
                        <button
                          onClick={() => handleRemoveWhitelistWallet(addr)}
                          className="text-rose-500 hover:text-rose-700 p-1"
                          title="Revoke Permission"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex items-center space-x-3 pt-2 border-t border-gray-100">
              <button
                onClick={() => setPrivacyModalParcel(null)}
                className="flex-1 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-xs font-semibold text-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleSavePrivacy}
                disabled={savingPrivacy}
                className="flex-1 py-2.5 rounded-xl bg-[#059669] hover:bg-[#047857] text-xs font-bold text-white shadow-md disabled:opacity-40"
              >
                {savingPrivacy ? "Saving Permissions..." : "Confirm & Apply Privacy"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Listing / Price Modal */}
      {editingParcel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white rounded-2xl p-6 shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-gray-900">
              {editingParcel.isForSale ? "Update Asking Price or Delist" : "List Land For Sale via Escrow"}
            </h3>
            <p className="text-xs text-gray-500">
              Khasra: #{editingParcel.khasraNumber} ({editingParcel.village})
            </p>

            <div>
              <label className="block text-[11px] font-bold text-gray-700 mb-1">
                Asking Price (ETH)
              </label>
              <input
                type="text"
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
                className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 text-xs text-gray-900 focus:outline-none focus:border-emerald-600 font-medium"
              />
            </div>

            <div className="flex items-center space-x-2 pt-2">
              <button
                onClick={() => setEditingParcel(null)}
                className="flex-1 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-xs font-semibold text-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={() => handleToggleForSale(editingParcel)}
                disabled={actionLoading}
                className="flex-1 py-2 rounded-xl bg-[#059669] hover:bg-[#047857] text-xs font-bold text-white disabled:opacity-40"
              >
                {actionLoading ? "Executing..." : "Confirm Listing"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
