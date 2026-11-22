import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import { Web3Provider } from "./context/Web3Context";
import { LanguageProvider } from "./context/LanguageContext";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Web3Provider>
      <LanguageProvider>
        <App />
      </LanguageProvider>
    </Web3Provider>
  </React.StrictMode>
);
