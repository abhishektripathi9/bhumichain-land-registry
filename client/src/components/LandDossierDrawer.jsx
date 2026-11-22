import React, { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { ethers } from "ethers";
import { useWeb3 } from "../context/Web3Context";
import {
  X,
  ShieldCheck,
  AlertTriangle,
  Clock,
  FileText,
  MessageSquare,
  DollarSign,
  User,
  MapPin,
  ExternalLink,
  QrCode,
  CheckCircle,
  Lock,
} from "lucide-react";

export default function LandDossierDrawer({ parcel, onClose, onOpenChat, onEscrowSuccess }) {
  const { account, contract, signer } = useWeb3();
  const [activeTab, setActiveTab] = useState("overview"); // overview, history, document, cert
  const [isBuying, setIsBuying] = useState(false);
  const [buyError, setBuyError] = useState("");
  const [buySuccess, setBuySuccess] = useState("");

  if (!parcel) return null;

  const isOwner = account && parcel.ownerWallet?.toLowerCase() === account.toLowerCase();
  const canBuy = parcel.isForSale && !parcel.disputeStatus && !isOwner;

  // Handle Smart Contract Escrow Buy
  const handleInitiateEscrow = async () => {
    if (!contract || !signer) {
      alert("कृपया भूमि बयाना (10% टोकन) देने के लिए अपना खाता चुनें।");
      return;
    }

    if (!parcel.onChainId) {
      alert("This parcel has not been assigned an on-chain ID yet.");
      return;
    }

    setIsBuying(true);
    setBuyError("");
    setBuySuccess("");

    try {
      const priceInWei = ethers.parseEther(parcel.price.toString());
      console.log(`Initiating escrow buy for Land ID ${parcel.onChainId} with ${parcel.price} ETH`);

      const tx = await contract.initiateEscrowBuy(parcel.onChainId, {
        value: priceInWei,
      });

      console.log("Transaction sent:", tx.hash);
      const receipt = await tx.wait();
      console.log("Escrow transaction confirmed:", receipt);

      setBuySuccess(`Escrow deal successfully initiated on-chain! Tx: ${tx.hash.slice(0, 10)}...${tx.hash.slice(-6)}`);

      if (onEscrowSuccess) {
        onEscrowSuccess(parcel);
      }
    } catch (err) {
      console.error("Escrow purchase failed:", err);
      setBuyError(err.reason || err.message || "Failed to initiate escrow. Check balance and network.");
    } finally {
      setIsBuying(false);
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-xl bg-slate-900/95 backdrop-blur-xl border-l border-slate-700/80 shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out">
      {/* Top Header */}
      <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-lg font-bold text-slate-100">
                Khasra No: {parcel.khasraNumber}
              </h2>
              {parcel.onChainId && (
                <span className="text-[11px] px-2 py-0.5 rounded font-mono font-bold bg-slate-800 text-teal-400 border border-teal-500/30">
                  On-Chain ID #{parcel.onChainId}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 flex items-center space-x-1 mt-0.5">
              <MapPin className="w-3.5 h-3.5 text-slate-500" />
              <span>
                {parcel.village}, Tehsil {parcel.tehsil}, {parcel.district}
              </span>
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Fraud / Loan / Status Banner */}
      <div className="px-6 py-3 border-b border-slate-800">
        {parcel.disputeStatus || parcel.loanFlag ? (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold uppercase tracking-wider text-rose-400">
                  Cadastral Warning: Encumbered Parcel
                </span>
                {parcel.loanFlag && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-rose-950 text-rose-300 border border-rose-800">
                    Bank Mortgaged
                  </span>
                )}
              </div>
              <p className="text-xs text-rose-200/90 mt-1">
                {parcel.disputeRemarks || "Active civil court suit or mortgage lien detected in revenue registers."}
              </p>
              {parcel.loanDetails?.bankName !== "None" && (
                <p className="text-[11px] text-rose-300 font-mono mt-1">
                  Bank: {parcel.loanDetails.bankName} | Outstanding: ₹{parcel.loanDetails.loanAmount?.toLocaleString("en-IN")}
                </p>
              )}
            </div>
          </div>
        ) : parcel.status === "Verified" ? (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center space-x-3">
            <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            <div className="flex-1">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                Clear Title Record Verified
              </span>
              <p className="text-xs text-slate-300 mt-0.5">
                Zero encumbrances, zero court disputes, verified by Government Sub-Registrar.
              </p>
            </div>
            {parcel.isForSale ? (
              <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-emerald-500 text-slate-950 shadow-sm">
                For Sale
              </span>
            ) : (
              <span className="text-xs font-semibold px-2 py-1 rounded-lg bg-blue-500/20 text-blue-300 border border-blue-500/30">
                Owned
              </span>
            )}
          </div>
        ) : (
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center space-x-3">
            <Clock className="w-5 h-5 text-amber-400 flex-shrink-0" />
            <div>
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                Pending Verification
              </span>
              <p className="text-xs text-slate-300 mt-0.5">
                Title deed uploaded. Awaiting physical field verification by Lekhpal & Registrar.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-slate-800 px-6 bg-slate-950/20 text-xs font-semibold">
        <button
          onClick={() => setActiveTab("overview")}
          className={`py-3 px-3 border-b-2 transition-all flex items-center space-x-1.5 ${
            activeTab === "overview"
              ? "border-emerald-400 text-emerald-400"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Cadastral Data</span>
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`py-3 px-3 border-b-2 transition-all flex items-center space-x-1.5 ${
            activeTab === "history"
              ? "border-emerald-400 text-emerald-400"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Chain of Custody ({parcel.ownershipHistory?.length || 1})</span>
        </button>
        <button
          onClick={() => setActiveTab("document")}
          className={`py-3 px-3 border-b-2 transition-all flex items-center space-x-1.5 ${
            activeTab === "document"
              ? "border-emerald-400 text-emerald-400"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <ExternalLink className="w-3.5 h-3.5" />
          <span>Deed Document</span>
        </button>
        <button
          onClick={() => setActiveTab("cert")}
          className={`py-3 px-3 border-b-2 transition-all flex items-center space-x-1.5 ${
            activeTab === "cert"
              ? "border-emerald-400 text-emerald-400"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <QrCode className="w-3.5 h-3.5" />
          <span>Certificate</span>
        </button>
      </div>

      {/* Drawer Body Content */}
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
        {/* Tab 1: Cadastral Overview */}
        {activeTab === "overview" && (
          <div className="space-y-5">
            {/* Price & Valuation Card */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60">
                <span className="text-[11px] font-medium text-slate-400">Escrow Asking Price</span>
                <div className="flex items-baseline space-x-1.5 mt-1">
                  <span className="text-2xl font-black text-emerald-400">{parcel.price}</span>
                  <span className="text-xs font-bold text-slate-300">ETH</span>
                </div>
                <span className="text-[11px] text-slate-500">10% डिजिटल बयाना (सुरक्षित टोकन)</span>
              </div>

              <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60">
                <span className="text-[11px] font-medium text-slate-400">Market Benchmark (Circle Rate)</span>
                <div className="flex items-baseline space-x-1 mt-1">
                  <span className="text-xl font-bold text-slate-200">
                    ₹{(parcel.marketPrice || 5000000).toLocaleString("en-IN")}
                  </span>
                </div>
                <span className="text-[11px] text-slate-500">UP Stamp & Registration Dept</span>
              </div>
            </div>

            {/* Land Specs Table */}
            <div className="rounded-xl bg-slate-800/40 border border-slate-800 overflow-hidden">
              <div className="px-4 py-3 bg-slate-800/80 border-b border-slate-700 text-xs font-bold text-slate-300 uppercase tracking-wider">
                Revenue Department Particulars
              </div>
              <div className="divide-y divide-slate-800 text-xs">
                <div className="grid grid-cols-2 px-4 py-2.5">
                  <span className="text-slate-400">Khasra / Gata No:</span>
                  <span className="font-semibold text-slate-200">{parcel.khasraNumber}</span>
                </div>
                <div className="grid grid-cols-2 px-4 py-2.5">
                  <span className="text-slate-400">Khata / Khatoni No:</span>
                  <span className="font-semibold text-slate-200">{parcel.khataNumber}</span>
                </div>
                <div className="grid grid-cols-2 px-4 py-2.5">
                  <span className="text-slate-400">Total Plot Area:</span>
                  <span className="font-semibold text-slate-200">
                    {parcel.area} m² ({parcel.areaHectares || (parcel.area / 10000).toFixed(3)} Hectares)
                  </span>
                </div>
                <div className="grid grid-cols-2 px-4 py-2.5">
                  <span className="text-slate-400">Village & Tehsil:</span>
                  <span className="font-semibold text-slate-200">
                    {parcel.village}, {parcel.tehsil}
                  </span>
                </div>
                <div className="grid grid-cols-2 px-4 py-2.5">
                  <span className="text-slate-400">District & State:</span>
                  <span className="font-semibold text-slate-200">
                    {parcel.district}, {parcel.state || "Uttar Pradesh"}
                  </span>
                </div>
              </div>
            </div>

            {/* Current Owner Profile Card */}
            <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Verified Landholder
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 font-semibold flex items-center space-x-1">
                  <CheckCircle className="w-3 h-3" />
                  <span>Aadhaar KYC Verified</span>
                </span>
              </div>

              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold">
                  {parcel.ownerName ? parcel.ownerName[0] : "O"}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-200">{parcel.ownerName}</h4>
                  <p className="text-[11px] font-mono text-slate-400">
                    {parcel.ownerWallet}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Chain of Custody (Ownership History) */}
        {activeTab === "history" && (
          <div className="space-y-4">
            <p className="text-xs text-slate-400">
              राजस्व अभिलेख एवं पंजीकृत विलेख इतिहास (Property History):
            </p>

            <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-700">
              {(parcel.ownershipHistory && parcel.ownershipHistory.length > 0
                ? parcel.ownershipHistory
                : [
                    {
                      ownerName: parcel.ownerName,
                      ownerWallet: parcel.ownerWallet,
                      fromDate: "2018-05-10",
                      toDate: "Present",
                      txHash: "Genesis Cadastral Allocation",
                    },
                  ]
              ).map((h, idx) => (
                <div key={idx} className="relative">
                  {/* Dot icon */}
                  <div className="absolute -left-[27px] top-1 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-slate-900 shadow"></div>

                  <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-200">{h.ownerName}</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-700">
                        {h.fromDate} → {h.toDate || "Present"}
                      </span>
                    </div>
                    <p className="text-[11px] font-mono text-slate-400">
                      Wallet: {h.ownerWallet?.slice(0, 10)}...{h.ownerWallet?.slice(-6)}
                    </p>
                    <p className="text-[10px] font-mono text-emerald-400/80 truncate">
                      Tx: {h.txHash || "Government Mutation Record"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: Registry Deed Document Viewer */}
        {activeTab === "document" && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300">Registered Sale Deed (Registry Copy)</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-900 text-cyan-400 border border-cyan-800 font-mono">
                  डिजिटल दस्तावेज संचयन (Digital Storage)
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Official scanned title deed certified by Uttar Pradesh Sub-Registrar Office.
              </p>
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 font-mono text-xs text-slate-300 break-all">
                दस्तावेज कोड (Doc Ref): {parcel.ipfsCid || "UP-REG-2024-DEED-DOC"}
              </div>

              {parcel.documentUrl && (
                <a
                  href={parcel.documentUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center space-x-1.5 text-xs text-emerald-400 hover:text-emerald-300 font-semibold"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>पंजीकृत दस्तावेज देखें (View Full Deed)</span>
                </a>
              )}
            </div>

            {/* Embedded Deed Mock Document */}
            <div className="p-6 rounded-xl bg-slate-950 border border-slate-800 font-serif text-slate-300 space-y-3 shadow-inner">
              <div className="text-center border-b border-slate-800 pb-3">
                <h3 className="font-bold text-sm tracking-wide uppercase text-slate-100">
                  Government of Uttar Pradesh — Registration Certificate
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Office of the Sub-Registrar, Sadar / Karchhana, Prayagraj
                </p>
              </div>
              <div className="text-xs space-y-2 leading-relaxed">
                <p>
                  <strong>Plot Identity:</strong> Khasra No. {parcel.khasraNumber}, Khata No. {parcel.khataNumber}, Village {parcel.village}.
                </p>
                <p>
                  <strong>Present Titleholder:</strong> {parcel.ownerName} (Wallet: {parcel.ownerWallet}).
                </p>
                <p>
                  <strong>Cadastral Measurement:</strong> Total area {parcel.area} Sq. Meters.
                </p>
                <p>
                  <strong>Stamp Duty & Registry Status:</strong> Mutated in state land records under UP Revenue Code.
                </p>
              </div>
              <div className="pt-3 border-t border-slate-800 flex justify-between text-[11px] text-slate-500 font-mono">
                <span>Digital Seal: VERIFIED_BHUMICHAIN</span>
                <span>Sub-Registrar Sadar</span>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: QR Land Title Certificate */}
        {activeTab === "cert" && (
          <div className="space-y-4 text-center">
            <div className="p-6 rounded-2xl bg-white text-slate-900 inline-block mx-auto shadow-xl">
              <QRCodeSVG
                value={`https://bhumichain.up.gov.in/verify/parcel/${parcel._id || parcel.khasraNumber}`}
                size={180}
                level="H"
                includeMargin={true}
              />
              <p className="text-[11px] font-mono font-bold mt-2 text-slate-700">
                PARCEL ID: {parcel.khasraNumber}
              </p>
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-100">
                Official Digital Land Certificate
              </h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                Field surveyors and prospective buyers can scan this QR code on physical premises to verify instant title authenticity directly on-chain.
              </p>
            </div>
          </div>
        )}

        {/* Buy Success / Error Notifications */}
        {buySuccess && (
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs">
            {buySuccess}
          </div>
        )}
        {buyError && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
            {buyError}
          </div>
        )}
      </div>

      {/* Bottom Action Footer */}
      <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/80 flex items-center space-x-3">
        {/* Chat with Owner */}
        <button
          onClick={() => onOpenChat(parcel)}
          className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all border border-slate-700 shadow-sm"
        >
          <MessageSquare className="w-4 h-4 text-teal-400" />
          <span>Chat with Owner</span>
        </button>

        {/* Buy via Earnest Token */}
        {canBuy && (
          <button
            onClick={handleInitiateEscrow}
            disabled={isBuying}
            className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-xl text-xs font-bold transition-all shadow-lg ${
              isBuying
                ? "bg-emerald-800 text-emerald-200 cursor-not-allowed"
                : "bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-slate-950 shadow-emerald-500/20"
            }`}
          >
            <Lock className="w-4 h-4" />
            <span>{isBuying ? "बयाना जमा हो रहा है..." : `10% बयाना देकर सुरक्षित करें (${parcel.price} ETH)`}</span>
          </button>
        )}

        {isOwner && (
          <div className="flex-1 text-center py-2 text-xs font-semibold text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 rounded-xl">
            You own this parcel
          </div>
        )}
      </div>
    </div>
  );
}
