import express from "express";
import auth from "../../middlewares/auth.js";
import validate from "../../middlewares/validate.js";
import * as walletController from "./wallet.controller.js";
import {
  createWalletSchema,
  addMemberSchema,
  depositFundsSchema,
  spendFundsSchema,
} from "./wallet.schema.js";

const router = express.Router();

/**
 * Wallet routes
 * All endpoints require authentication.
 */

// Wallet management
router.post("/", auth, validate(createWalletSchema), walletController.create);
router.get("/", auth, walletController.list);
router.get("/:walletId", auth, walletController.details);

// Member management
router.post("/:walletId/members", auth, validate(addMemberSchema), walletController.addMember);
router.delete("/:walletId/members/:userId", auth, walletController.removeMember);

// Fund movements
router.post("/:walletId/deposit", auth, validate(depositFundsSchema), walletController.deposit);
router.post("/:walletId/spend", auth, validate(spendFundsSchema), walletController.spend);
router.get("/:walletId/transactions", auth, walletController.transactions);

export default router;
