import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import morgan from "morgan";

import env from "./config/env.js";
import routes from "./routes/index.js";
import errorHandler from "./middlewares/errorHandler.js";
import ApiError from "./errors/apiError.js";
import { ErrorCodes } from "./errors/errorCodes.js";

const app = express();

// ── Core Middleware ─────────────────────────────────────────
app.use(
  cors({
    origin: env.CLIENT_URL,
    credentials: true, // Required: allows httpOnly cookies to be sent cross-origin
  })
);
app.use(helmet());
app.use(cookieParser(env.COOKIE_SECRET));
app.use(express.json({ limit: "16kb" })); // Limit body size to prevent abuse
app.use(morgan("dev"));

// ── Routes ──────────────────────────────────────────────────
app.use("/api", routes);

// ── 404 handler (undefined routes) ──────────────────────────
// Must be AFTER all routes but BEFORE errorHandler.
// If no route matched, this creates an ApiError and passes it down.
app.use((req, res, next) => {
  next(ApiError.from(ErrorCodes.NOT_FOUND, `Route ${req.originalUrl} not found`));
});

// ── Global error handler ────────────────────────────────────
// Must be the LAST middleware. Express identifies it by the 4 parameters.
app.use(errorHandler);

export default app;
