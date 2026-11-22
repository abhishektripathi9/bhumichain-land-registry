import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure .env is loaded at the very top
dotenv.config({ path: path.join(__dirname, ".env") });
dotenv.config();

// Forward to src/server.js
export * from "./src/server.js";
