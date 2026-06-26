import express from "express";
import auth from "../../middlewares/auth.js";
import validate from "../../middlewares/validate.js";
import * as transactionController from "./transaction.controller.js";
import { sendMoneySchema } from "./transaction.schema.js";

const router = express.Router();

/**
 * Transaction routes
 * All routes require authentication.
 */

router.post("/send", auth, validate(sendMoneySchema), transactionController.send);
router.get("/history", auth, transactionController.history);
router.get("/history/user/:userId", auth, transactionController.historyWithUser);
router.get("/:transactionId", auth, transactionController.detail);

export default router;
