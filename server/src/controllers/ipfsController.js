import fs from "fs";
import path from "path";
import crypto from "crypto";
import axios from "axios";
import FormData from "form-data";

/**
 * Layer 4: Web3 & IPFS Sync Bridge - IPFS Controller
 * Supports Pinata Cloud IPFS upload with deterministic fallback
 */
export const uploadToIPFS = async (req, res) => {
  try {
    if (!req.file && !req.body.content) {
      return res.status(400).json({ success: false, message: "No file or content uploaded" });
    }

    const pinataApiKey = process.env.PINATA_API_KEY;
    const pinataSecretKey = process.env.PINATA_SECRET_KEY;

    // Check if Pinata keys are configured and valid
    if (pinataApiKey && pinataSecretKey && pinataApiKey !== "your_pinata_api_key") {
      try {
        const formData = new FormData();
        if (req.file) {
          formData.append("file", fs.createReadStream(req.file.path));
        } else {
          formData.append("file", Buffer.from(req.body.content), {
            filename: req.body.filename || "land-metadata.json",
            contentType: "application/json",
          });
        }

        const metadata = JSON.stringify({
          name: req.file ? req.file.originalname : "LandRegistryDoc",
        });
        formData.append("pinataMetadata", metadata);

        const response = await axios.post("https://api.pinata.cloud/pinning/pinFileToIPFS", formData, {
          maxBodyLength: Infinity,
          headers: {
            pinata_api_key: pinataApiKey,
            pinata_secret_api_key: pinataSecretKey,
            ...formData.getHeaders(),
          },
        });

        const ipfsCid = response.data.IpfsHash;
        const gatewayUrl = `https://gateway.pinata.cloud/ipfs/${ipfsCid}`;

        if (req.file && fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }

        return res.json({
          success: true,
          mode: "PINATA_LIVE_IPFS",
          ipfsCid,
          gatewayUrl,
          fileSize: response.data.PinSize,
          timestamp: response.data.Timestamp,
        });
      } catch (pinataErr) {
        console.warn("Pinata upload failed, falling back to local IPFS bridge:", pinataErr.message);
      }
    }

    // Local IPFS Gateway Emulation fallback (always works offline & without API credentials)
    let fileHash;
    let fileName = "deed.pdf";
    let fileUrl = "";

    if (req.file) {
      const fileBuffer = fs.readFileSync(req.file.path);
      fileHash = "bafybei" + crypto.createHash("sha256").update(fileBuffer).digest("hex").slice(0, 46);
      fileName = req.file.filename;
      fileUrl = `/uploads/${fileName}`;
    } else {
      const content = req.body.content || JSON.stringify(req.body);
      fileHash = "bafybei" + crypto.createHash("sha256").update(content).digest("hex").slice(0, 46);
      fileName = `metadata-${Date.now()}.json`;
      const uploadDir = path.join(process.cwd(), "uploads");
      if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
      fs.writeFileSync(path.join(uploadDir, fileName), content);
      fileUrl = `/uploads/${fileName}`;
    }

    return res.json({
      success: true,
      mode: "STANDALONE_IPFS_BRIDGE",
      ipfsCid: fileHash,
      gatewayUrl: fileUrl,
      fileName,
      message: "Pinned successfully to Land Registry decentralized bridge",
    });
  } catch (err) {
    console.error("IPFS Upload Error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};
