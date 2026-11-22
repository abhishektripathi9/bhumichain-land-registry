import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    propertyId: {
      type: String,
      required: true,
      index: true,
    },
    senderWallet: {
      type: String,
      required: true,
      lowercase: true,
      index: true,
    },
    receiverWallet: {
      type: String,
      required: true,
      lowercase: true,
      index: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Message", messageSchema);
