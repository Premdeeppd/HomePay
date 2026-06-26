import express from "express";

const router = express.Router();

router.get("/", (req, res) => {
  res.json({
    sucess: true,
    message: "Welcome to HomePay API",
  });
});

export default router;
