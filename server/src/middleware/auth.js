import mongoose from "mongoose";
import User from "../models/User.js";

// In-memory users store fallback
const memoryUsers = new Map();

/**
 * Middleware to verify wallet presence and determine role
 */
export async function requireWallet(req, res, next) {
  const wallet = req.headers["x-wallet-address"] || req.query.wallet || req.body.walletAddress;
  if (!wallet) {
    return res.status(401).json({ success: false, message: "Wallet address header (x-wallet-address) is required" });
  }

  const normalizedWallet = wallet.toLowerCase();

  try {
    if (mongoose.connection.readyState === 1) {
      let user = await User.findOne({ walletAddress: normalizedWallet });
      if (!user) {
        user = await User.create({
          walletAddress: normalizedWallet,
          name: `Citizen ${wallet.slice(0, 6)}...${wallet.slice(-4)}`,
          role: "citizen",
          kycVerified: true,
        });
      }
      req.user = user;
    } else {
      // In-Memory Mode fallback
      let user = memoryUsers.get(normalizedWallet);
      if (!user) {
        user = {
          walletAddress: normalizedWallet,
          name: `Citizen ${wallet.slice(0, 6)}...${wallet.slice(-4)}`,
          role: normalizedWallet === "0x70997970c51812dc3a010c7d01b50e0d17dc79c8" ? "registrar" : "citizen",
          kycVerified: true,
        };
        memoryUsers.set(normalizedWallet, user);
      }
      req.user = user;
    }
    next();
  } catch (err) {
    res.status(500).json({ success: false, message: "Authentication error", error: err.message });
  }
}

/**
 * Middleware to enforce role-based access control (Registrar or Admin)
 */
export function requireRole(allowedRoles = ["registrar", "admin"]) {
  return async (req, res, next) => {
    const wallet = req.headers["x-wallet-address"] || req.query.wallet || req.body.walletAddress;
    if (!wallet) {
      return res.status(401).json({ success: false, message: "Wallet address header is required" });
    }

    const normalizedWallet = wallet.toLowerCase();

    try {
      let role = "citizen";
      if (mongoose.connection.readyState === 1) {
        const user = await User.findOne({ walletAddress: normalizedWallet });
        if (user) role = user.role;
      } else {
        const user = memoryUsers.get(normalizedWallet);
        if (user) role = user.role;
        else if (normalizedWallet === "0x70997970c51812dc3a010c7d01b50e0d17dc79c8" || normalizedWallet === "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266") {
          role = "registrar";
        }
      }

      if (!allowedRoles.includes(role)) {
        return res.status(403).json({
          success: false,
          message: `Forbidden: Access restricted to [${allowedRoles.join(", ")}] roles.`,
        });
      }
      next();
    } catch (err) {
      res.status(500).json({ success: false, message: "Role verification error", error: err.message });
    }
  };
}
