import express from "express";
import auth from "../../middlewares/auth.js";
import * as notificationController from "./notification.controller.js";

const router = express.Router();

/**
 * Notification routes
 * All routes require authentication.
 */

router.get("/", auth, notificationController.list);
router.get("/unread-count", auth, notificationController.unreadCount);
router.patch("/:notificationId/read", auth, notificationController.read);
router.patch("/read-all", auth, notificationController.readAll);

export default router;
