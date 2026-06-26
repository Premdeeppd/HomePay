import ApiResponse from "../../responses/apiResponse.js";
import * as walletService from "./wallet.service.js";

export async function create(req, res) {
  const ownerId = req.user.userId;
  const { name, description } = req.body;

  const wallet = await walletService.createWallet(ownerId, { name, description });

  return res
    .status(201)
    .json(new ApiResponse(201, "Shared wallet created successfully", { wallet }));
}

export async function list(req, res) {
  const userId = req.user.userId;

  const wallets = await walletService.listMyWallets(userId);

  return res
    .status(200)
    .json(new ApiResponse(200, "Wallets list retrieved successfully", { wallets }));
}

export async function details(req, res) {
  const userId = req.user.userId;
  const { walletId } = req.params;

  const details = await walletService.getWalletDetails(walletId, userId);

  return res
    .status(200)
    .json(new ApiResponse(200, "Wallet details retrieved successfully", details));
}

export async function addMember(req, res) {
  const ownerId = req.user.userId;
  const { walletId } = req.params;
  const { userId: targetUserId } = req.body;

  const member = await walletService.addMember(walletId, ownerId, targetUserId);

  return res
    .status(201)
    .json(new ApiResponse(201, "Member added successfully", { member }));
}

export async function removeMember(req, res) {
  const ownerId = req.user.userId;
  const { walletId, userId: targetUserId } = req.params;

  await walletService.removeMember(walletId, ownerId, targetUserId);

  return res
    .status(200)
    .json(new ApiResponse(200, "Member removed successfully"));
}

export async function deposit(req, res) {
  const userId = req.user.userId;
  const { walletId } = req.params;
  const { amount } = req.body;

  const transaction = await walletService.deposit(walletId, userId, amount);

  return res
    .status(200)
    .json(new ApiResponse(200, "Funds deposited successfully", { transaction }));
}

export async function spend(req, res) {
  const userId = req.user.userId;
  const { walletId } = req.params;
  const { amount, receiverId, description } = req.body;

  const transaction = await walletService.spend(walletId, userId, {
    amount,
    receiverId,
    description,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, "Wallet expenditure completed", { transaction }));
}

export async function transactions(req, res) {
  const userId = req.user.userId;
  const { walletId } = req.params;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;

  const result = await walletService.getWalletTransactions(walletId, userId, {
    page,
    limit,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, "Wallet transaction history retrieved successfully", result));
}
