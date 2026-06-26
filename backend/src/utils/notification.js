import Notification from "../models/Notification.model.js";

/**
 * Shared utility to create a user notification.
 *
 * This keeps notification creation DRY (Don't Repeat Yourself) across
 * the codebase. Services like friendships, transactions, and wallets
 * can just import and call this function.
 *
 * If we add push notifications or real-time WebSockets later, we can
 * centralize the logic inside this helper without modifying any service files!
 *
 * @param {Object} params - Notification parameters
 * @param {string} params.user - The ID of the recipient user
 * @param {string} params.type - The type of notification (enum from Notification schema)
 * @param {string} params.title - Main headline (e.g. "Prem sent you ₹500")
 * @param {string} [params.message] - Optional details
 * @param {string} [params.relatedModel] - Polymorphic ref model (Wallet, Transaction, etc.)
 * @param {string} [params.relatedId] - Polymorphic ref ObjectId
 * @param {Object} [options] - mongoose query options (e.g., { session })
 * @returns {Promise<Object>} Created notification document
 */
export async function createNotification(
  { user, type, title, message = null, relatedModel = null, relatedId = null },
  options = {}
) {
  const notification = await Notification.create(
    [
      {
        user,
        type,
        title,
        message,
        relatedModel,
        relatedId,
      },
    ],
    options
  );

  return notification[0];
}
