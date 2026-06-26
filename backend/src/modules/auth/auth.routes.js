import express from "express";
import validate from "../../middlewares/validate.js";
import auth from "../../middlewares/auth.js";
import * as authController from "./auth.controller.js";
import { registerSchema, loginSchema } from "./auth.schema.js";

const router = express.Router();

/**
 * Authentication Routes
 *
 * Pattern:
 *   router.post("/path", [middleware], authController.handler)
 */

router.post("/register", validate(registerSchema), authController.register);
router.post("/login", validate(loginSchema), authController.login);
router.post("/refresh", authController.refresh);
router.post("/logout", authController.logout);

// Protected routes (require valid access token)
router.post("/logout-all", auth, authController.logoutAll);
router.get("/me", auth, authController.me);
router.get("/sessions", auth, authController.sessions);

export default router;
