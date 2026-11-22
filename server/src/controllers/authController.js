import mongoose from "mongoose";
import User from "../models/User.js";

// In-memory fallback for users when running without active MongoDB daemon
let memoryUsers = [
  {
    _id: "user_rameshwar",
    walletAddress: "0x94b73e12d3f5c24a0991823aa1175628bc38431e",
    name: "रामेश्वर शर्मा (Rameshwar Sharma)",
    phone: "+91 98765-43210",
    aadhaarRef: "•••• •••• 9214",
    citizenType: "farmer",
    state: "Uttar Pradesh",
    district: "Prayagraj",
    tehsil: "Karchhana",
    village: "Mauza Naini",
    khasraNumber: "104",
    role: "citizen",
    kycVerified: true,
  },
  {
    _id: "user_alok",
    walletAddress: "0x70997970c51812dc3a010c7d01b50e0d17dc79c8",
    name: "आलोक नाथ त्रिपाठी (Alok Nath Tripathi)",
    phone: "+91 94500-67890",
    aadhaarRef: "•••• •••• 5512",
    citizenType: "buyer",
    state: "Uttar Pradesh",
    district: "Prayagraj",
    tehsil: "Sadar",
    village: "Civil Lines",
    khasraNumber: "",
    role: "citizen",
    kycVerified: true,
  },
];

export const getProfile = async (req, res) => {
  try {
    const wallet = req.params.walletAddress?.toLowerCase();
    if (mongoose.connection.readyState === 1) {
      let user = await User.findOne({ walletAddress: wallet });
      if (!user) {
        user = await User.create({
          walletAddress: wallet,
          name: `Citizen ${wallet.slice(0, 6)}...${wallet.slice(-4)}`,
          role: "citizen",
          kycVerified: true,
        });
      }
      return res.json({ success: true, user });
    }

    // In-memory fallback
    let user = memoryUsers.find((u) => u.walletAddress === wallet);
    if (!user) {
      user = {
        _id: `mem_user_${Date.now()}`,
        walletAddress: wallet,
        name: `Citizen ${wallet.slice(0, 6)}...${wallet.slice(-4)}`,
        phone: "+91 98XXX-XXXXX",
        aadhaarRef: "•••• •••• 1234",
        citizenType: "citizen",
        state: "Uttar Pradesh",
        district: "Prayagraj",
        tehsil: "Karchhana",
        village: "Mauza Naini",
        role: "citizen",
        kycVerified: true,
      };
      memoryUsers.push(user);
    }
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const registerCitizen = async (req, res) => {
  try {
    const {
      name,
      phone,
      aadhaarRef,
      citizenType,
      state,
      district,
      tehsil,
      village,
      khasraNumber,
      walletAddress,
    } = req.body;

    if (!name || !phone) {
      return res.status(400).json({
        success: false,
        message: "Full Name and Phone Number are required for UP Registration",
      });
    }

    const wallet = (walletAddress || `0x${Math.random().toString(16).slice(2, 42).padEnd(40, "0")}`).toLowerCase();

    if (mongoose.connection.readyState === 1) {
      let user = await User.findOneAndUpdate(
        { $or: [{ phone }, { walletAddress: wallet }] },
        {
          name,
          phone,
          aadhaarRef: aadhaarRef || "•••• •••• " + Math.floor(1000 + Math.random() * 9000),
          citizenType: citizenType || "farmer",
          state: state || "Uttar Pradesh",
          district: district || "Prayagraj",
          tehsil: tehsil || "Karchhana",
          village: village || "Mauza Naini",
          khasraNumber: khasraNumber || "",
          walletAddress: wallet,
          role: "citizen",
          kycVerified: true,
        },
        { new: true, upsert: true }
      );
      return res.json({
        success: true,
        message: "UP Citizen / Farmer Registered Successfully",
        user,
      });
    }

    // In-memory fallback
    let existingIndex = memoryUsers.findIndex((u) => u.phone === phone || u.walletAddress === wallet);
    const newUser = {
      _id: `mem_user_${Date.now()}`,
      walletAddress: wallet,
      name,
      phone,
      aadhaarRef: aadhaarRef || "•••• •••• " + Math.floor(1000 + Math.random() * 9000),
      citizenType: citizenType || "farmer",
      state: state || "Uttar Pradesh",
      district: district || "Prayagraj",
      tehsil: tehsil || "Karchhana",
      village: village || "Mauza Naini",
      khasraNumber: khasraNumber || "",
      role: "citizen",
      kycVerified: true,
    };

    if (existingIndex >= 0) {
      memoryUsers[existingIndex] = { ...memoryUsers[existingIndex], ...newUser };
    } else {
      memoryUsers.push(newUser);
    }

    res.json({
      success: true,
      message: "UP Citizen / Farmer Registered Successfully (Verified)",
      user: newUser,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const loginCitizen = async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) {
      return res.status(400).json({ success: false, message: "Phone number is required" });
    }

    let cleanPhone = phone.replace(/\s+/g, "").replace("-", "");

    if (mongoose.connection.readyState === 1) {
      let user = await User.findOne({
        phone: { $regex: cleanPhone.slice(-10), $options: "i" },
      });
      if (user) {
        return res.json({ success: true, message: "Citizen Authenticated", user });
      }
    }

    // In-memory fallback or pre-seed
    let user = memoryUsers.find((u) => u.phone.includes(cleanPhone.slice(-8)));
    if (!user) {
      // Auto-provision verified UP Farmer
      user = {
        _id: `mem_user_${Date.now()}`,
        walletAddress: `0x71c${Math.random().toString(16).slice(2, 38)}`,
        name: "प्रयागराज काश्तकार (Prayagraj Farmer)",
        phone: phone,
        aadhaarRef: "•••• •••• " + Math.floor(1000 + Math.random() * 9000),
        citizenType: "farmer",
        state: "Uttar Pradesh",
        district: "Prayagraj",
        tehsil: "Karchhana",
        village: "Mauza Naini",
        khasraNumber: "104",
        role: "citizen",
        kycVerified: true,
      };
      memoryUsers.push(user);
    }

    res.json({ success: true, message: "Citizen Authenticated", user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const updateRole = async (req, res) => {
  try {
    const { walletAddress, role } = req.body;
    if (!["citizen", "registrar", "admin"].includes(role)) {
      return res.status(400).json({ success: false, message: "Invalid role specified" });
    }
    if (mongoose.connection.readyState === 1) {
      const user = await User.findOneAndUpdate(
        { walletAddress: walletAddress.toLowerCase() },
        { role },
        { new: true, upsert: true }
      );
      return res.json({ success: true, message: `Role updated to ${role}`, user });
    }

    let user = memoryUsers.find((u) => u.walletAddress === walletAddress.toLowerCase());
    if (user) {
      user.role = role;
    }
    res.json({ success: true, message: `Role updated to ${role}`, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const listUsers = async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const users = await User.find().sort({ createdAt: -1 });
      return res.json({ success: true, count: users.length, users });
    }
    res.json({ success: true, count: memoryUsers.length, users: memoryUsers });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
