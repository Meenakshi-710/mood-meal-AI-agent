const express = require("express");

const router = express.Router();

router.get("/", (_req, res) => {
  res.status(200).json({
    ok: true,
    service: "mood-meal-backend",
    message: "Service is healthy",
  });
});

module.exports = router;
