import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema(
  {
    txHash: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    propertyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
    },
    onChainId: {
      type: Number,
      index: true,
    },
    buyerWallet: {
      type: String,
      required: true,
      lowercase: true,
    },
    sellerWallet: {
      type: String,
      required: true,
      lowercase: true,
    },
    amount: {
      type: String,
      required: true,
    },
    escrowStatus: {
      type: String,
      enum: ["INITIATED", "APPROVED", "CANCELLED", "COMPLETED"],
      default: "INITIATED",
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Transaction", transactionSchema);
