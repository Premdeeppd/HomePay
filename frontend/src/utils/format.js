/**
 * Format a number as Indian Rupees (₹).
 *
 * Lakh/crore grouping:
 *   1250000 ➔ "₹12,50,000.00"
 *
 * @param {number} amount - The amount in rupees
 * @returns {string} Formatted currency string
 */
export function formatCurrency(amount) {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return "₹0.00";
  }
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format an ISO date string into a user-friendly format.
 *
 * Examples:
 *   - Today's date: "10:30 AM" or "Today, 10:30 AM"
 *   - Other dates: "27 Jun 2026, 12:15 PM"
 *
 * @param {string|Date} dateInput - ISO timestamp or Date object
 * @param {boolean} [includeTime=true] - Whether to include time
 * @returns {string} Formatted date string
 */
export function formatDate(dateInput, includeTime = true) {
  if (!dateInput) return "—";
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return "—";

  const optionsDate = { day: "numeric", month: "short", year: "numeric" };
  const optionsTime = { hour: "2-digit", minute: "2-digit", hour12: true };

  const formattedDate = date.toLocaleDateString("en-IN", optionsDate);

  if (includeTime) {
    const formattedTime = date.toLocaleTimeString("en-IN", optionsTime);
    return `${formattedDate}, ${formattedTime}`;
  }

  return formattedDate;
}
