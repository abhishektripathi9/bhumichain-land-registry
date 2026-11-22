import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    walletAddress: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    name: {
      type: String,
      default: "Verified Citizen",
      trim: true,
    },
    phone: {
      type: String,
      default: "",
    },
    email: {
      type: String,
      default: "",
      lowercase: true,
      trim: true,
    },
    aadhaarRef: {
      type: String,
      default: "", // Masked or hash of Aadhaar UID
    },
    citizenType: {
      type: String,
      enum: ["farmer", "buyer", "advocate", "officer"],
      default: "farmer",
    },
    state: {
      type: String,
      default: "Uttar Pradesh",
    },
    district: {
      type: String,
      default: "Prayagraj",
    },
    tehsil: {
      type: String,
      default: "Karchhana",
    },
    village: {
      type: String,
      default: "Mauza Naini",
    },
    khasraNumber: {
      type: String,
      default: "",
    },
    role: {
      type: String,
      enum: ["citizen", "registrar", "admin"],
      default: "citizen",
    },
    kycVerified: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("User", userSchema);
