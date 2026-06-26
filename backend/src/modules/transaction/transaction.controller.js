import ApiResponse from "../../responses/apiResponse.js";
import * as transactionService from "./transaction.service.js";

export async function send(req, res) {
  const senderId = req.user.userId;
  const { receiverId, amount, description } = req.body;

  const transaction = await transactionService.sendMoney(senderId, {
    receiverId,
    amount,
    description,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, "Money sent successfully", { transaction }));
}

export async function history(req, res) {
  const userId = req.user.userId;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const { type, startDate, endDate } = req.query;

  const result = await transactionService.getHistory(userId, {
    page,
    limit,
    type,
    startDate,
    endDate,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, "Transaction history retrieved successfully", result));
}

export async function historyWithUser(req, res) {
  const currentUserId = req.user.userId;
  const { userId: otherUserId } = req.params;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;

  const result = await transactionService.getHistoryWithUser(currentUserId, otherUserId, {
    page,
    limit,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, "User transaction history retrieved", result));
}

export async function detail(req, res) {
  const currentUserId = req.user.userId;
  const { transactionId } = req.params;

  const transaction = await transactionService.getTransactionDetail(transactionId, currentUserId);

  return res
    .status(200)
    .json(new ApiResponse(200, "Transaction details retrieved successfully", { transaction }));
}
