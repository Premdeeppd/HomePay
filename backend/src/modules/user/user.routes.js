import express from "express";
import auth from "../../middlewares/auth.js";
import validate from "../../middlewares/validate.js";
import * as userController from "./user.controller.js";
import { updateProfileSchema, addFundsSchema } from "./user.schema.js";

const router = express.Router();

/**
 * User routes
 * All routes are protected and require a valid access token.
 */

router.get("/profile", auth, userController.getProfile);
router.patch("/profile", auth, validate(updateProfileSchema), userController.updateProfile);
router.get("/search", auth, userController.search);
router.get("/balance", auth, userController.getBalance);
router.post("/add-funds", auth, validate(addFundsSchema), userController.addFunds);

export default router;
