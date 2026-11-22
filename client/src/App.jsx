import React, { useState, useEffect } from "react";
import Navbar from "./components/Navbar";
import MapExplorer from "./components/MapExplorer";
import RegisterLand from "./components/RegisterLand";
import MyProperties from "./components/MyProperties";
import VerifyQR from "./components/VerifyQR";
import AdminPanel from "./pages/AdminPanel";
import RegistrarConsole from "./pages/RegistrarConsole";
import ChatModal from "./components/ChatModal";
import ErrorBoundary from "./components/ErrorBoundary";
import Footer from "./components/Footer";
import { useLanguage } from "./context/LanguageContext";
import { Shield, Lock } from "lucide-react";

export default function App() {
  const { language, t } = useLanguage();

  // Check if initial route is /admin, ?admin=true, or #admin
  const checkIsAdminPath = () => {
    if (typeof window === "undefined") return false;
    const pathname = window.location.pathname.toLowerCase();
    const search = window.location.search.toLowerCase();
    const hash = window.location.hash.toLowerCase();
    return (
      pathname.startsWith("/admin") ||
      search.includes("admin=true") ||
      hash === "#admin"
    );
  };

  const [isAdminMode, setIsAdminMode] = useState(checkIsAdminPath);
  const [activeTab, setActiveTab] = useState("map"); // 'map' | 'register' | 'my-properties' | 'verify-qr'
  const [currentDistrict, setCurrentDistrict] = useState("");
  const [chatParcel, setChatParcel] = useState(null);
  const [externalScanTrigger, setExternalScanTrigger] = useState(0);

  // Sync state with browser URL popstate (Back/Forward buttons)
  useEffect(() => {
    const handlePopState = () => {
      setIsAdminMode(checkIsAdminPath());
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // Handlers for switching views
  const navigateToAdmin = () => {
    window.history.pushState({}, "", "/admin");
    setIsAdminMode(true);
  };

  const navigateToPublic = () => {
    window.history.pushState({}, "", "/");
    setIsAdminMode(false);
    setActiveTab("map");
  };

  const handleScanGPSClick = () => {
    setActiveTab("map");
    setExternalScanTrigger((prev) => prev + 1);
  };

  const handleInspectOnMap = (parcel) => {
    setActiveTab("map");
  };

  // If Admin Mode is active: Render the isolated, secure Government Registrar & Admin Console
  if (isAdminMode) {
    return (
      <ErrorBoundary>
        <RegistrarConsole onNavigateToPublic={navigateToPublic} />
      </ErrorBoundary>
    );
  }

  // Otherwise: Render the Public Citizen Portal
  return (
    <div className="h-screen w-screen overflow-hidden bg-[#f8fafc] text-gray-900 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      {/* Top Header Bar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onScanGPS={handleScanGPSClick}
        currentDistrict={currentDistrict}
        onNavigateToAdmin={navigateToAdmin}
      />

      {/* Main Split-Screen / Tab Content Workspace - Fits Flush Between Navbar & Footer */}
      <main className="flex-1 min-h-0 relative flex flex-col overflow-hidden">
        {activeTab === "map" && (
          <MapExplorer
            onOpenChat={(parcel) => setChatParcel(parcel)}
            externalScanTrigger={externalScanTrigger}
            currentDistrict={currentDistrict}
            onDistrictChange={(d) => setCurrentDistrict(d)}
          />
        )}

        {activeTab === "register" && (
          <div className="flex-1 overflow-y-auto">
            <RegisterLand
              onRegistrationSuccess={() => {
                setActiveTab("map");
              }}
            />
          </div>
        )}

        {activeTab === "my-properties" && (
          <div className="flex-1 overflow-y-auto">
            <MyProperties
              onSelectParcel={() => setActiveTab("map")}
              onOpenChat={(parcel) => setChatParcel(parcel)}
            />
          </div>
        )}

        {activeTab === "verify-qr" && (
          <div className="flex-1 overflow-y-auto">
            <VerifyQR onInspectOnMap={handleInspectOnMap} />
          </div>
        )}

        {/* Real-Time Buyer-Seller Encrypted P2P Chat Modal */}
        {chatParcel && (
          <ChatModal
            parcel={chatParcel}
            onClose={() => setChatParcel(null)}
          />
        )}
      </main>

      {/* Official Footer with 2-Page Slideable Drawer & Revenue Gateway */}
      <Footer navigateToAdmin={navigateToAdmin} />
    </div>
  );
}
