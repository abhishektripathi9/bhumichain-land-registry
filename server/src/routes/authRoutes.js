import express from "express";
import {
  getProfile,
  updateRole,
  listUsers,
  registerCitizen,
  loginCitizen,
} from "../controllers/authController.js";
import { requireRole } from "../middleware/auth.js";

const router = express.Router();

router.get("/profile/:walletAddress", getProfile);
router.get("/users", listUsers);
router.post("/register-citizen", registerCitizen);
router.post("/login-citizen", loginCitizen);
router.post("/role", requireRole(["admin"]), updateRole);

export default router;
