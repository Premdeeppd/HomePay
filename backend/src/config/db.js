import mongoose from "mongoose";
import env from "./env.js";

export async function connectDB() {
  try {
    await mongoose.connect(env.MONGO_URI);
    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1); // Exit process with failure code 1 if the database connection fails.
  }
}
