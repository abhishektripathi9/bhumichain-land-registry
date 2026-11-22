import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { uploadToIPFS } from "../controllers/ipfsController.js";

const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, unique);
  },
});

const upload = multer({ storage });
const router = express.Router();

router.post("/upload", upload.single("file"), uploadToIPFS);

export default router;
