/**
 * Shared helper functions used across multiple modules.
 */

/**
 * Returns an ordered pair of two ObjectIds for friendship lookups.
 *
 * Why? In the friendships collection, we store exactly ONE document per
 * friendship pair. To prevent duplicates (A→B and B→A), we always store
 * the smaller ObjectId as `user1` and the larger as `user2`.
 *
 * This means checking "are A and B friends?" is always:
 *   Friendship.findOne({ user1: smaller, user2: larger })
 * — a single indexed lookup. No $or query needed.
 *
 * @param {ObjectId|string} idA - First user ID
 * @param {ObjectId|string} idB - Second user ID
 * @returns {{ user1: ObjectId|string, user2: ObjectId|string }}
 *
 * @example
 *   const pair = orderedPair(userA._id, userB._id);
 *   const friendship = await Friendship.findOne(pair);
 */
export function orderedPair(idA, idB) {
  const strA = idA.toString();
  const strB = idB.toString();

  return strA < strB
    ? { user1: idA, user2: idB }
    : { user1: idB, user2: idA };
}

/**
 * Format a number as Indian Rupees (₹).
 *
 * Uses the "en-IN" locale for Indian number formatting:
 *   1500    → "₹1,500.00"
 *   1234567 → "₹12,34,567.00"  (lakh/crore grouping)
 *
 * @param {number} amount - The amount in rupees
 * @returns {string} Formatted currency string
 */
export function formatCurrency(amount) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format(amount);
}
