/**
 * Dynamic API Configuration for BhumiChain UP Land Registry
 * 
 * Strict URL Resolution:
 * 1. NEVER allows relative paths like 'api/bhulekh/...' that resolve wrongly to '/land-registry/api/...'.
 * 2. NEVER hardcodes 'http://localhost:5000' in production.
 * 3. In production: ALWAYS resolves to `${window.location.origin}/api/${cleanEndpoint}`
 *    (e.g., https://abhishek-portfolio-uir4.onrender.com/api/bhulekh/...)
 * 4. In local dev (Vite port 3000 / 5173): resolves to http://localhost:5000/api/${cleanEndpoint}
 */

export const getApiUrl = (endpoint = "") => {
  // Strip any leading '/api/' or '/' to normalize
  const cleanEndpoint = String(endpoint).trim().replace(/^\/?api\//, "").replace(/^\//, "");

  // 1. Explicit VITE_API_URL environment variable override if provided
  if (import.meta.env && import.meta.env.VITE_API_URL) {
    const base = import.meta.env.VITE_API_URL.replace(/\/$/, "");
    return `${base}/api/${cleanEndpoint}`;
  }

  // 2. Browser Window Origin Resolution
  if (typeof window !== "undefined" && window.location) {
    const origin = window.location.origin;
    // Local Vite dev server on port 3000 / 5173 -> route to local Express backend on port 5000
    if (
      origin.includes(":3000") ||
      origin.includes(":5173") ||
      (window.location.hostname === "localhost" && window.location.port !== "5000")
    ) {
      return `http://localhost:5000/api/${cleanEndpoint}`;
    }
    // Production (Render, Vercel, Netlify, Custom Domain)
    // ALWAYS resolves to ${window.location.origin}/api/${cleanEndpoint}
    return `${origin}/api/${cleanEndpoint}`;
  }

  // 3. Fallback for non-browser SSR
  return `http://localhost:5000/api/${cleanEndpoint}`;
};

export const getApiBaseUrl = () => {
  if (import.meta.env && import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL.replace(/\/$/, "");
  }
  if (typeof window !== "undefined" && window.location) {
    const origin = window.location.origin;
    if (
      origin.includes(":3000") ||
      origin.includes(":5173") ||
      (window.location.hostname === "localhost" && window.location.port !== "5000")
    ) {
      return "http://localhost:5000";
    }
    return origin.replace(/\/$/, "");
  }
  return "http://localhost:5000";
};

export const API_BASE_URL = getApiBaseUrl();
export default getApiUrl;
