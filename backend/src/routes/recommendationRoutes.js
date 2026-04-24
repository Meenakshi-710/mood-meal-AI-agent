const express = require("express");
const { getRecommendation } = require("../controllers/recommendationController");

const router = express.Router();

router.post("/", getRecommendation);

module.exports = router;
