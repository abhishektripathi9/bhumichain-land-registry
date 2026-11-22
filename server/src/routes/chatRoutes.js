import express from "express";
import { getMessagesByProperty, getConversationsByWallet } from "../controllers/chatController.js";

const router = express.Router();

router.get("/property/:propertyId", getMessagesByProperty);
router.get("/user/:walletAddress", getConversationsByWallet);

export default router;
