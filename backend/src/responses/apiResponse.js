/**
 * Standardized success response wrapper.
 *
 * Ensures every successful response from your API has the same shape:
 * {
 *   success: true,
 *   statusCode: 200,
 *   message: "User created successfully",
 *   data: { user: { ... } }
 * }
 *
 * Why? Your frontend can always trust the shape of the response.
 * `if (res.data.success)` works universally — no guessing.
 *
 * @example
 *   // In a controller:
 *   res.status(201).json(new ApiResponse(201, "User created", { user }));
 *
 *   // Response without data:
 *   res.status(200).json(new ApiResponse(200, "Logged out successfully"));
 */
class ApiResponse {
  /**
   * @param {number}  statusCode - HTTP status code
   * @param {string}  message    - Human-readable success message
   * @param {Object}  [data]     - Optional payload (user, transaction, etc.)
   */
  constructor(statusCode, message, data = null) {
    this.success = statusCode < 400;
    this.statusCode = statusCode;
    this.message = message;

    // Only include `data` key if there's actually data to send.
    // Keeps responses clean: no `"data": null` on logout/delete responses.
    if (data !== null) {
      this.data = data;
    }
  }
}

export default ApiResponse;
