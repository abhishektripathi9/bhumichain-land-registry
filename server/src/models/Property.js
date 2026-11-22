import mongoose from "mongoose";

const ownershipHistorySchema = new mongoose.Schema({
  ownerName: { type: String, required: true },
  ownerWallet: { type: String, required: true, lowercase: true },
  fromDate: { type: String, default: "" },
  toDate: { type: String, default: "Present" },
  txHash: { type: String, default: "" },
});

const loanDetailsSchema = new mongoose.Schema({
  bankName: { type: String, default: "None" },
  loanAmount: { type: Number, default: 0 },
  mortgageDate: { type: String, default: null },
});

const propertySchema = new mongoose.Schema(
  {
    onChainId: {
      type: Number,
      index: true,
      unique: true,
      sparse: true,
    },
    khasraNumber: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    khataNumber: {
      type: String,
      required: true,
      trim: true,
    },
    village: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    tehsil: {
      type: String,
      required: true,
      trim: true,
    },
    district: {
      type: String,
      required: true,
      trim: true,
    },
    state: {
      type: String,
      default: "Uttar Pradesh",
    },
    ownerName: {
      type: String,
      required: true,
      trim: true,
    },
    ownerWallet: {
      type: String,
      required: true,
      lowercase: true,
      index: true,
    },
    area: {
      type: Number, // In Square Meters
      required: true,
    },
    areaHectares: {
      type: Number,
      default: 0,
    },
    price: {
      type: String, // ETH price as string for precision
      default: "1.0",
    },
    marketPrice: {
      type: Number, // In INR
      default: 5000000,
    },
    status: {
      type: String,
      enum: ["Pending", "Verified", "Rejected", "Disputed"],
      default: "Pending",
      index: true,
    },
    isForSale: {
      type: Boolean,
      default: false,
      index: true,
    },
    loanFlag: {
      type: Boolean,
      default: false,
      index: true,
    },
    loanDetails: {
      type: loanDetailsSchema,
      default: () => ({}),
    },
    disputeStatus: {
      type: Boolean,
      default: false,
      index: true,
    },
    disputeRemarks: {
      type: String,
      default: "Clear Title. No court dispute found.",
    },
    ipfsCid: {
      type: String,
      default: "",
    },
    documentUrl: {
      type: String,
      default: "",
    },
    visibilityMode: {
      type: String,
      enum: ["PUBLIC", "RESTRICTED", "CONFIDENTIAL"],
      default: "PUBLIC",
      index: true,
    },
    allowedViewers: [{ type: String, lowercase: true, trim: true }],
    ownershipHistory: [ownershipHistorySchema],
    geometry: {
      type: {
        type: String,
        enum: ["Polygon"],
        required: true,
        default: "Polygon",
      },
      coordinates: {
        type: [[[Number]]], // [[[lng, lat], [lng, lat], ...]]
        required: true,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Crucial 2dsphere index for GIS polygon search and point-in-polygon queries
propertySchema.index({ geometry: "2dsphere" });

export default mongoose.model("Property", propertySchema);
