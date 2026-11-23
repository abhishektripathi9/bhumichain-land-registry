import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1. Initialize environment variables at the very top of server entry
dotenv.config({ path: path.join(__dirname, "../.env") });
dotenv.config();

import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import fs from "fs";

import { connectDB } from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import propertyRoutes from "./routes/propertyRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import ipfsRoutes from "./routes/ipfsRoutes.js";
import registrarRoutes from "./routes/registrarRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";
import bhulekhRoutes from "./routes/bhulekhRoutes.js";
import systemRoutes from "./routes/systemRoutes.js";
import marketplaceRoutes from "./routes/marketplaceRoutes.js";
import registryRoutes from "./routes/registryRoutes.js";
import { getVillages, getKhatauniNakal, liveVillageSearch, getPincode, getRealParcels, verifyBlockHarvest, getKhasraHistory } from "./controllers/bhulekhController.js";
import { saveChatMessage } from "./controllers/chatController.js";
import { startBlockchainListener } from "./services/listenerService.js";
import { liveGovDataService } from "./services/liveGovDataService.js";

const app = express();
const server = http.createServer(app);

// Initialize Socket.io with CORS
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PATCH", "DELETE"],
  },
});

// Middleware
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  })
);
app.options("*", cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Static uploads directory (for IPFS emulator fallback & downloaded deeds)
const uploadsPath = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true });
}
app.use("/uploads", express.static(uploadsPath));

// API Routes (Layer 1)
app.use("/api/auth", authRoutes);
app.use("/api/properties", propertyRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/messages", chatRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/ipfs", ipfsRoutes);
app.use("/api/registrar", registrarRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/bhulekh", bhulekhRoutes);
app.use("/api/system", systemRoutes);
app.use("/api/marketplace", marketplaceRoutes);
app.use("/api/registry", registryRoutes);

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "healthy",
    dapp: "BhumiChain Land Registry API",
    version: "2.0.0",
    layers: {
      layer1: "REST API & Socket.io Gateway Active",
      layer2: "Geospatial 2dsphere & Verification Engine Active",
      layer3: "MongoDB Cadastral Database Active",
      layer4: "Decentralized IPFS & Web3 Event Bridge Active",
    },
    timestamp: new Date().toISOString(),
  });
});

// Diagnostic System & data.gov.in Live API Status endpoint (Direct Mounts)
app.get(["/api/system/api-status", "/system/api-status", "/api/system-status"], (req, res) => {
  const diag = liveGovDataService.getDiagnosticStatus();
  res.json({
    status: "ok",
    dataGovKeyLoaded: Boolean(process.env.DATA_GOV_API_KEY),
    overpassConnected: true,
    ...diag,
  });
});

// Diagnostic Block Harvest Verification endpoint
app.get("/api/system/verify-block", verifyBlockHarvest);

// Explicit direct mounts for bhulekh villages, khatauni, and live search
app.get("/api/bhulekh/villages", getVillages);
app.get("/api/bhulekh/khatauni", getKhatauniNakal);
app.get("/api/bhulekh/live-village-search", liveVillageSearch);
app.get("/api/bhulekh/pincode", getPincode);
app.get("/api/bhulekh/real-parcels", getRealParcels);
app.get("/api/bhulekh/khasra-history", getKhasraHistory);

// Socket.io Real-Time Buyer-Seller Rooms (Layer 1)
io.on("connection", (socket) => {
  // Join property specific room
  socket.on("join_room", ({ propertyId, walletAddress }) => {
    const room = `property_${propertyId}`;
    socket.join(room);
    console.log(`Socket [${socket.id}] wallet [${walletAddress}] joined room: ${room}`);
    socket.emit("joined_room", { room, propertyId });
  });

  // Buyer or Seller sends a message (Instant Real-time Emission)
  socket.on("send_message", async (data) => {
    const { propertyId, senderWallet, receiverWallet, message } = data;
    if (!propertyId || !senderWallet || !message) return;

    const room = `property_${propertyId}`;
    const payload = {
      propertyId,
      senderWallet,
      receiverWallet: receiverWallet || "",
      message,
      createdAt: new Date().toISOString(),
    };

    // 1. Emit instantly across the room so chat latency is < 2ms
    io.to(room).emit("new_message", payload);

    // 2. Persist in background without delaying realtime socket emission
    saveChatMessage({
      propertyId,
      senderWallet,
      receiverWallet,
      message,
    }).catch(() => {});
  });

  socket.on("disconnect", () => {
    // disconnected
  });
});

const PORT = process.env.PORT || 5000;

async function bootstrap() {
  await connectDB();
  server.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(`  BHUMICHAIN 4-LAYER BACKEND SERVER RUNNING ON PORT ${PORT}`);
    console.log(`  API Gateway: http://localhost:${PORT}/api/health`);
    console.log(`=======================================================`);
  });

  // Start Ethers.js blockchain event listener service (Layer 4)
  setTimeout(() => {
    startBlockchainListener();
  }, 1500);
}

bootstrap();
