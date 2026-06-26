import express from "express";
import authRoutes from "../modules/auth/auth.routes.js";
import userRoutes from "../modules/user/user.routes.js";
import friendRoutes from "../modules/friend/friend.routes.js";
import transactionRoutes from "../modules/transaction/transaction.routes.js";
import walletRoutes from "../modules/wallet/wallet.routes.js";
import notificationRoutes from "../modules/notification/notification.routes.js";

const router = express.Router();

router.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Welcome to HomePay API",
  });
});

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/friends", friendRoutes);
router.use("/transactions", transactionRoutes);
router.use("/wallets", walletRoutes);
router.use("/notifications", notificationRoutes);

export default router;

