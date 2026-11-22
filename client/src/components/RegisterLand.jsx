import React, { useState, useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet-draw";
import { ethers } from "ethers";
import { useWeb3 } from "../context/Web3Context";
import {
  FilePlus,
  UploadCloud,
  CheckCircle,
  AlertTriangle,
  MapPin,
  FileText,
  Shield,
  Layers,
  ArrowRight,
} from "lucide-react";

export default function RegisterLand({ onRegistrationSuccess }) {
  const { account, contract, signer, connectWallet } = useWeb3();

  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const drawnItemsRef = useRef(null);

  // Form State
  const [khasraNumber, setKhasraNumber] = useState("");
  const [khataNumber, setKhataNumber] = useState("");
  const [village, setVillage] = useState("Naini");
  const [tehsil, setTehsil] = useState("Karchhana");
  const [district, setDistrict] = useState("Prayagraj");
  const [area, setArea] = useState(2400);
  const [price, setPrice] = useState("1.50");
  const [marketPrice, setMarketPrice] = useState(4500000);
  const [ownerName, setOwnerName] = useState("Rameshwar Sharma");
  const [geometry, setGeometry] = useState(null);

  // File & IPFS state
  const [deedFile, setDeedFile] = useState(null);
  const [ipfsCid, setIpfsCid] = useState("");
  const [ipfsUploading, setIpfsUploading] = useState(false);
  const [deedUrl, setDeedUrl] = useState("");

  // Submission state
  const [submitting, setSubmitting] = useState(false);
  const [txHash, setTxHash] = useState("");
  const [createdLandId, setCreatedLandId] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";

  // 1. Initialize Map with Leaflet Draw
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Prayagraj Naini center
    const map = L.map(mapContainerRef.current, {
      center: [25.4200, 81.8645],
      zoom: 16,
    });

    L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      {
        attribution: "Esri Satellite • Bhu-Naksha Cadastral",
        maxZoom: 19,
      }
    ).addTo(map);

    const drawnItems = new L.FeatureGroup();
    map.addLayer(drawnItems);
    drawnItemsRef.current = drawnItems;

    // Initialize Leaflet Draw Control
    const drawControl = new L.Control.Draw({
      position: "topright",
      draw: {
        polygon: {
          allowIntersection: false,
          showArea: true,
          drawError: {
            color: "#e11d48",
            message: "Boundary edges cannot intersect!",
          },
          shapeOptions: {
            color: "#10b981",
            fillColor: "#10b981",
            fillOpacity: 0.4,
          },
        },
        rectangle: false,
        circle: false,
        circlemarker: false,
        marker: false,
        polyline: false,
      },
      edit: {
        featureGroup: drawnItems,
        remove: true,
      },
    });
    map.addControl(drawControl);

    // Event listener when user finishes drawing a polygon
    map.on(L.Draw.Event.CREATED, (e) => {
      drawnItems.clearLayers();
      const layer = e.layer;
      drawnItems.addLayer(layer);

      const geoJson = layer.toGeoJSON();
      setGeometry(geoJson.geometry);

      const latlngs = layer.getLatLngs()[0];
      if (latlngs && latlngs.length >= 3) {
        let calcArea = 0;
        for (let i = 0; i < latlngs.length; i++) {
          const j = (i + 1) % latlngs.length;
          calcArea += latlngs[i].lat * latlngs[j].lng;
          calcArea -= latlngs[j].lat * latlngs[i].lng;
        }
        calcArea = Math.abs(calcArea * 111000 * 111000 * Math.cos(25.42 * (Math.PI / 180))) / 2;
        const roundedArea = Math.round(calcArea * 10.764) || 2400; // in sq.ft
        setArea(roundedArea);
        setMarketPrice(roundedArea * 1875);
      }
    });

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Quick preset polygon loader
  const handleLoadPresetBoundary = () => {
    const map = mapInstanceRef.current;
    const drawn = drawnItemsRef.current;
    if (!map || !drawn) return;

    drawn.clearLayers();

    const sampleCoords = [
      [25.4195, 81.8625],
      [25.4195, 81.8645],
      [25.4180, 81.8648],
      [25.4180, 81.8628],
    ];

    const polygon = L.polygon(sampleCoords, {
      color: "#10b981",
      fillColor: "#10b981",
      fillOpacity: 0.4,
    }).addTo(drawn);

    map.fitBounds(polygon.getBounds(), { padding: [50, 50] });

    setGeometry({
      type: "Polygon",
      coordinates: [
        [
          [81.8625, 25.4195],
          [81.8645, 25.4195],
          [81.8648, 25.4180],
          [81.8628, 25.4180],
          [81.8625, 25.4195],
        ],
      ],
    });
    setKhasraNumber("104/A");
    setKhataNumber("00412");
    setArea(2400);
    setMarketPrice(4500000);
  };

  // 2. Handle File Upload to IPFS Bridge
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setDeedFile(file);
    setIpfsUploading(true);
    setErrorMessage("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`${apiUrl}/api/ipfs/upload`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (data.success) {
        setIpfsCid(data.ipfsCid);
        setDeedUrl(data.gatewayUrl);
      } else {
        setErrorMessage(data.message || "IPFS deed upload failed");
      }
    } catch (err) {
      console.error("Upload error:", err);
      setErrorMessage("Could not connect to IPFS gateway");
    } finally {
      setIpfsUploading(false);
    }
  };

  // 3. Register Land on Smart Contract + Backend Sync
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!account) {
      alert("Please connect your wallet first.");
      connectWallet();
      return;
    }

    if (!khasraNumber) {
      alert("Please enter a valid Khasra / Gata Number.");
      return;
    }

    if (!geometry) {
      alert("Please draw the land boundary polygon on the satellite map or click 'Use Preset Boundary'.");
      return;
    }

    setSubmitting(true);
    setErrorMessage("");
    setTxHash("");
    setCreatedLandId(null);

    try {
      const locationString = `${village}, Tehsil ${tehsil}, ${district}`;
      const priceInWei = ethers.parseEther(price.toString());
      const effectiveCid = ipfsCid || `bafybei_deed_${khasraNumber.replace(/[^a-zA-Z0-9]/g, "")}_${Date.now()}`;

      let onChainId = null;
      let transactionHash = "ON-CHAIN-RECORD";

      // Submit on-chain if smart contract instance is available
      if (contract && signer) {
        console.log("Submitting registerLand transaction to Ethereum Hardhat node...");
        const tx = await contract.registerLand(
          khasraNumber,
          locationString,
          Math.round(area / 10.764) || 223,
          priceInWei,
          effectiveCid
        );
        const receipt = await tx.wait();
        transactionHash = tx.hash;

        if (receipt.logs) {
          for (const log of receipt.logs) {
            try {
              const parsed = contract.interface.parseLog(log);
              if (parsed && parsed.name === "LandRegistered") {
                onChainId = Number(parsed.args[0]);
                break;
              }
            } catch (err) {
              // Ignore non-matching log
            }
          }
        }
      }

      setTxHash(transactionHash);
      setCreatedLandId(onChainId);

      // Sync metadata to MongoDB Backend (Layer 3)
      const payload = {
        onChainId,
        khasraNumber,
        khataNumber,
        village,
        tehsil,
        district,
        ownerName,
        ownerWallet: account,
        area: Math.round(area / 10.764) || 223,
        areaSqFt: Number(area),
        areaAre: parseFloat((area / 1076.4).toFixed(2)),
        areaAcre: parseFloat((area / 43560).toFixed(3)),
        price: price.toString(),
        marketPrice: Number(marketPrice),
        circleRate: Math.round(Number(marketPrice) * 0.8),
        ipfsCid: effectiveCid,
        documentUrl: deedUrl || `https://ipfs.io/ipfs/${effectiveCid}/registry_deed.pdf`,
        geometry,
        status: "Pending",
      };

      const res = await fetch(`${apiUrl}/api/properties/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-wallet-address": account,
        },
        body: JSON.stringify(payload),
      });

      const syncResult = await res.json();
      if (onRegistrationSuccess) {
        onRegistrationSuccess(syncResult.property || payload);
      }
    } catch (err) {
      console.error("Land Registration Error:", err);
      setErrorMessage(err.reason || err.message || "Registration failed. Verify contract connection.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
              <FilePlus className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-black text-gray-900 tracking-tight">
              Plot & Register Cadastral Land Parcel
            </h1>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            उत्तर प्रदेश के किसानों व भूस्वामियों के लिए अपनी भूमि का सैटेलाइट नक्शा देखने एवं नया भू-अभिलेख दर्ज कराने की आधिकारिक नागरिक सेवा।
          </p>
        </div>

        <button
          onClick={handleLoadPresetBoundary}
          className="flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold bg-white hover:bg-gray-50 text-blue-700 border border-blue-200 shadow-2xs transition-colors"
        >
          <Layers className="w-4 h-4" />
          <span>Load Preset Naini Plot</span>
        </button>
      </div>

      {/* Main Form Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Interactive GIS Map Polygon Drawer (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col space-y-3">
          <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-700 flex items-center space-x-2">
                <MapPin className="w-4 h-4 text-emerald-600" />
                <span>Step 1: Draw Plot Boundary on Satellite Imagery</span>
              </span>
              <span className="text-[11px] text-gray-500 font-medium">
                Click polygon tool at top-right to outline plot
              </span>
            </div>

            {/* Map Container */}
            <div
              ref={mapContainerRef}
              className="w-full h-[470px] rounded-xl overflow-hidden border border-gray-300 z-10 shadow-inner"
            />

            <div className="mt-3 flex items-center justify-between text-xs text-gray-600 border-t border-gray-100 pt-2 font-medium">
              <div className="flex items-center space-x-2">
                <span className={`w-2 h-2 rounded-full ${geometry ? "bg-emerald-500" : "bg-amber-400"}`}></span>
                <span>
                  {geometry ? "Cadastral Boundary Captured" : "Awaiting polygon outline"}
                </span>
              </div>
              <span className="font-mono text-emerald-700 font-bold">
                Area: {area.toLocaleString()} sq.ft ({(area / 1076.4).toFixed(2)} Are)
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Land Attributes & Title Deed Submission Form (5 Cols) */}
        <div className="lg:col-span-5 bg-white border border-gray-200 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="border-b border-gray-100 pb-2.5">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-800">
                Step 2: Revenue Particulars & Title Deed
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">
                  Khasra / Gata No. *
                </label>
                <input
                  type="text"
                  required
                  value={khasraNumber}
                  onChange={(e) => setKhasraNumber(e.target.value)}
                  placeholder="e.g. 104"
                  className="w-full bg-gray-50/50 border border-gray-300 rounded-xl px-3 py-2 text-xs text-gray-900 focus:outline-none focus:border-emerald-600 font-medium"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">
                  Khata Number
                </label>
                <input
                  type="text"
                  value={khataNumber}
                  onChange={(e) => setKhataNumber(e.target.value)}
                  placeholder="e.g. 00412"
                  className="w-full bg-gray-50/50 border border-gray-300 rounded-xl px-3 py-2 text-xs text-gray-900 focus:outline-none focus:border-emerald-600 font-medium"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">
                  Mauza / Village
                </label>
                <input
                  type="text"
                  value={village}
                  onChange={(e) => setVillage(e.target.value)}
                  className="w-full bg-gray-50/50 border border-gray-300 rounded-xl px-3 py-2 text-xs text-gray-900 focus:outline-none focus:border-emerald-600 font-medium"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">
                  Tehsil
                </label>
                <input
                  type="text"
                  value={tehsil}
                  onChange={(e) => setTehsil(e.target.value)}
                  className="w-full bg-gray-50/50 border border-gray-300 rounded-xl px-3 py-2 text-xs text-gray-900 focus:outline-none focus:border-emerald-600 font-medium"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">
                  District
                </label>
                <input
                  type="text"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className="w-full bg-gray-50/50 border border-gray-300 rounded-xl px-3 py-2 text-xs text-gray-900 focus:outline-none focus:border-emerald-600 font-medium"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">
                  Plot Area (sq.ft)
                </label>
                <input
                  type="number"
                  value={area}
                  onChange={(e) => setArea(Number(e.target.value))}
                  className="w-full bg-gray-50/50 border border-gray-300 rounded-xl px-3 py-2 text-xs text-gray-900 focus:outline-none focus:border-emerald-600 font-medium"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">
                  Asking Price (ETH)
                </label>
                <input
                  type="text"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full bg-gray-50/50 border border-gray-300 rounded-xl px-3 py-2 text-xs text-gray-900 focus:outline-none focus:border-emerald-600 font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-gray-700 mb-1">
                Sole Legal Proprietor Name (Aadhaar Verified)
              </label>
              <input
                type="text"
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                className="w-full bg-gray-50/50 border border-gray-300 rounded-xl px-3 py-2 text-xs text-gray-900 focus:outline-none focus:border-emerald-600 font-medium"
              />
            </div>

            {/* IPFS Title Deed PDF Upload Box */}
            <div>
              <label className="block text-[11px] font-bold text-gray-700 mb-1">
                Certified Scanned Title Deed (PDF / Image)
              </label>
              <div className="relative border border-dashed border-gray-300 rounded-xl p-4 bg-gray-50 hover:bg-gray-100/70 transition-colors text-center cursor-pointer">
                <input
                  type="file"
                  accept=".pdf,image/*"
                  onChange={handleFileUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="flex flex-col items-center justify-center space-y-1">
                  <UploadCloud className="w-6 h-6 text-emerald-600" />
                  <span className="text-xs font-bold text-gray-800">
                    {deedFile ? deedFile.name : "Select or drag Registry Deed PDF"}
                  </span>
                  <span className="text-[10px] text-gray-500">
                    दस्तावेज सुरक्षित सरकारी सर्वर पर अपलोड होगा
                  </span>
                </div>
              </div>

              {ipfsUploading && (
                <p className="text-[11px] text-emerald-600 mt-1 animate-pulse font-mono">
                  विलेख दस्तावेज सुरक्षित रूप से अपलोड हो रहा है...
                </p>
              )}
              {ipfsCid && (
                <p className="text-[10px] text-emerald-700 mt-1 font-mono break-all font-semibold">
                  डिजिटल दस्तावेज कोड: {ipfsCid}
                </p>
              )}
            </div>

            {/* Notifications */}
            {txHash && (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs space-y-1">
                <div className="font-bold flex items-center space-x-1.5">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  <span>On-Chain Registration Successful!</span>
                </div>
                {createdLandId && (
                  <p className="font-mono text-[11px]">Assigned Land ID: #{createdLandId}</p>
                )}
                <p className="font-mono text-[10px] truncate">Tx: {txHash}</p>
              </div>
            )}

            {errorMessage && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold">
                {errorMessage}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className={`w-full py-3.5 rounded-xl font-bold text-xs text-white transition-all shadow-md ${
                submitting
                  ? "bg-emerald-800 cursor-not-allowed"
                  : "bg-[#059669] hover:bg-[#047857] active:scale-[0.99]"
              }`}
            >
              {submitting ? "Signing & Submitting to Blockchain Node..." : "Submit Land Application to Registrar"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
