/**
 * Dynamic API Base URL Configuration for BhumiChain
 * Seamlessly resolves between Localhost Dev (Port 3000 -> 5000) and Production (Render)
 */

export const getApiBaseUrl = () => {
  // 1. Environment variable override if provided
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL.replace(/\/$/, "");
  }

  // 2. Browser Window Origin Resolution
  if (typeof window !== "undefined" && window.location && window.location.origin) {
    const origin = window.location.origin;
    // Local Vite dev server on port 3000 -> point to local Express backend on port 5000
    if (origin.includes(":3000") || origin.includes("localhost:3000") || origin.includes("127.0.0.1:3000")) {
      return "http://localhost:5000";
    }
    // Production (Render, Vercel, Netlify, Custom Domain)
    return origin.replace(/\/$/, "");
  }

  // 3. Ultimate Fallback
  return "http://localhost:5000";
};

export const API_BASE_URL = getApiBaseUrl();
export default API_BASE_URL;
