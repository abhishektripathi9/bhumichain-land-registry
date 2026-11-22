import Message from "../models/Message.js";
import { isMongoConnected } from "../config/db.js";

// In-Memory fallback store ensuring real-time chat works with or without MongoDB
const inMemoryMessages = [];

// Fetch chat history for a specific property parcel
export const getMessagesByProperty = async (req, res) => {
  try {
    const { propertyId } = req.params;
    if (isMongoConnected) {
      const messages = await Message.find({ propertyId }).sort({ createdAt: 1 });
      return res.json({ success: true, count: messages.length, messages });
    }
    const filtered = inMemoryMessages.filter((m) => String(m.propertyId) === String(propertyId));
    return res.json({ success: true, count: filtered.length, messages: filtered });
  } catch (err) {
    const filtered = inMemoryMessages.filter((m) => String(m.propertyId) === String(req.params.propertyId));
    return res.json({ success: true, count: filtered.length, messages: filtered });
  }
};

// Fetch conversations involving a specific wallet
export const getConversationsByWallet = async (req, res) => {
  try {
    const wallet = req.params.walletAddress?.toLowerCase();
    if (isMongoConnected) {
      const messages = await Message.find({
        $or: [{ senderWallet: wallet }, { receiverWallet: wallet }],
      }).sort({ createdAt: -1 });
      return res.json({ success: true, count: messages.length, messages });
    }
    const filtered = inMemoryMessages.filter(
      (m) => m.senderWallet?.toLowerCase() === wallet || m.receiverWallet?.toLowerCase() === wallet
    );
    return res.json({ success: true, count: filtered.length, messages: filtered });
  } catch (err) {
    return res.json({ success: true, count: 0, messages: [] });
  }
};

// Internal function called by Socket.io handler
export const saveChatMessage = async ({ propertyId, senderWallet, receiverWallet, message }) => {
  const item = {
    propertyId: String(propertyId),
    senderWallet: (senderWallet || "").toLowerCase(),
    receiverWallet: (receiverWallet || "").toLowerCase(),
    message: String(message),
    createdAt: new Date().toISOString(),
  };

  inMemoryMessages.push(item);

  if (isMongoConnected) {
    try {
      const newMsg = await Message.create(item);
      return newMsg;
    } catch (err) {
      console.warn("MongoDB chat persist warning:", err.message);
    }
  }
  return item;
};
