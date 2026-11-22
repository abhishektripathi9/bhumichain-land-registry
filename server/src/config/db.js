import mongoose from "mongoose";

export let isMongoConnected = false;

export async function connectDB() {
  const uri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/bhumichain";
  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 3000,
    });
    isMongoConnected = true;
    console.log(">>> [Database] Connected successfully to MongoDB at:", uri);
  } catch (error) {
    isMongoConnected = false;
    console.warn(">>> [Database] Note: Local MongoDB service not detected (" + error.message + ").");
    console.warn(">>> [Database] Activating In-Memory GeoJSON Cadastral Store with Prayagraj Seed Dataset.");
    console.warn(">>> [Database] (To connect to a live database, start MongoDB locally or configure MONGO_URI in server/.env)");
  }
}
