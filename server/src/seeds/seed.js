import mongoose from "mongoose";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import User from "../models/User.js";
import Property from "../models/Property.js";
import Transaction from "../models/Transaction.js";
import Message from "../models/Message.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "../../.env") });

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/bhumichain";

async function seedDatabase() {
  try {
    console.log("Connecting to MongoDB at:", MONGO_URI);
    await mongoose.connect(MONGO_URI);
    console.log("MongoDB connection established.");

    // Clean existing records
    await User.deleteMany({});
    await Property.deleteMany({});
    await Transaction.deleteMany({});
    await Message.deleteMany({});
    console.log("Cleaned existing collections.");

    // Ensure 2dsphere index on Property geometry
    await Property.collection.createIndex({ geometry: "2dsphere" });
    console.log("Ensured 2dsphere spatial index on Property.geometry.");

    // Create Initial Users
    const defaultUsers = [
      {
        walletAddress: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
        name: "Super Admin (Revenue Dept UP)",
        phone: "+91 94150 11223",
        email: "admin.bhumichain@up.gov.in",
        aadhaarRef: "XXXX-XXXX-9012",
        role: "admin",
        kycVerified: true,
      },
      {
        walletAddress: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
        name: "Shri Alok Nath (Chief Registrar Prayagraj)",
        phone: "+91 98390 44556",
        email: "registrar.prayagraj@up.gov.in",
        aadhaarRef: "XXXX-XXXX-3344",
        role: "registrar",
        kycVerified: true,
      },
      {
        walletAddress: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
        name: "Rajesh Kumar Verma",
        phone: "+91 94500 88990",
        email: "rajesh.verma@example.com",
        aadhaarRef: "XXXX-XXXX-6789",
        role: "citizen",
        kycVerified: true,
      },
      {
        walletAddress: "0x90F79bf6EB2c4f870365E785982E1f101E93b906",
        name: "Amit Kumar Saxena (Verified Buyer)",
        phone: "+91 99180 22334",
        email: "amit.saxena@example.com",
        aadhaarRef: "XXXX-XXXX-4567",
        role: "citizen",
        kycVerified: true,
      },
      {
        walletAddress: "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65",
        name: "Suresh Chandra Mishra",
        phone: "+91 98890 33445",
        email: "suresh.mishra@example.com",
        aadhaarRef: "XXXX-XXXX-8901",
        role: "citizen",
        kycVerified: true,
      },
      {
        walletAddress: "0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc",
        name: "Pooja Sharma",
        phone: "+91 94155 77889",
        email: "pooja.sharma@example.com",
        aadhaarRef: "XXXX-XXXX-1234",
        role: "citizen",
        kycVerified: true,
      },
    ];

    await User.insertMany(defaultUsers);
    console.log(`Successfully seeded ${defaultUsers.length} system users.`);

    // Load and insert 12 realistic Prayagraj land parcels
    const seedFilePath = path.join(__dirname, "seedData.json");
    const rawData = fs.readFileSync(seedFilePath, "utf8");
    const parcels = JSON.parse(rawData);

    const insertedProperties = await Property.insertMany(parcels);
    console.log(`Successfully seeded ${insertedProperties.length} realistic Prayagraj land parcels!`);

    // Add initial welcome messages
    const sampleMessages = [
      {
        propertyId: insertedProperties[0]._id.toString(),
        senderWallet: "0x90F79bf6EB2c4f870365E785982E1f101E93b906", // Buyer
        receiverWallet: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC", // Seller
        message: "Namaste Rajesh ji, I inspected parcel 142/1 on-site today. Is the 1.5 ETH price negotiable if I settle via Smart Contract Escrow this week?",
        createdAt: new Date(Date.now() - 3600000 * 5),
      },
      {
        propertyId: insertedProperties[0]._id.toString(),
        senderWallet: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC", // Seller
        receiverWallet: "0x90F79bf6EB2c4f870365E785982E1f101E93b906", // Buyer
        message: "Namaste Amit ji. The title is 100% clean and already verified by Chief Registrar. 1.5 ETH is firm. You can deposit to the smart contract escrow directly whenever you are ready.",
        createdAt: new Date(Date.now() - 3600000 * 2),
      },
    ];

    await Message.insertMany(sampleMessages);
    console.log("Seeded initial buyer-seller chat history.");

    console.log("--- SEEDING COMPLETED SUCCESSFULLY ---");
    process.exit(0);
  } catch (err) {
    console.error("Database Seeding Failed:", err);
    process.exit(1);
  }
}

seedDatabase();
