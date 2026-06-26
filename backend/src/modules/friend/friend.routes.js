import express from "express";
import auth from "../../middlewares/auth.js";
import validate from "../../middlewares/validate.js";
import * as friendController from "./friend.controller.js";
import { sendRequestSchema } from "./friend.schema.js";

const router = express.Router();

/**
 * Friend routes
 * All endpoints require authentication.
 */

// Friend Requests
router.post("/request", auth, validate(sendRequestSchema), friendController.sendRequest);
router.patch("/request/:requestId/accept", auth, friendController.acceptRequest);
router.patch("/request/:requestId/reject", auth, friendController.rejectRequest);
router.delete("/request/:requestId/cancel", auth, friendController.cancelRequest);

// Lists & Management
router.get("/requests/incoming", auth, friendController.incomingRequests);
router.get("/requests/outgoing", auth, friendController.outgoingRequests);
router.get("/list", auth, friendController.listFriends);
router.delete("/:friendshipId", auth, friendController.removeFriend);

export default router;
