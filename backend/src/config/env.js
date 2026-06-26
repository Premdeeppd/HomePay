import dotenv from "dotenv";

dotenv.config();

const env = {
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || "development",
  MONGO_URI: process.env.MONGO_URI,
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRE: process.env.JWT_EXPIRE,
  REFRESH_TOKEN_EXPIRE: process.env.REFRESH_TOKEN_EXPIRE,
  COOKIE_SECRET: process.env.COOKIE_SECRET || "default_cookie_secret_key",
  CLIENT_URL: process.env.CLIENT_URL || "http://localhost:5173",
};

export default env;
