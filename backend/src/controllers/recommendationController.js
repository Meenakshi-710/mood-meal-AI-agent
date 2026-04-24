const { buildRecommendation } = require("../services/recommendationService");

async function getRecommendation(req, res, next) {
  try {
    const { input, location } = req.body || {};

    if (!input || typeof input !== "string") {
      return res.status(400).json({
        ok: false,
        message: "Request body must include an 'input' string.",
      });
    }

    const result = await buildRecommendation({ input, location });
    return res.status(200).json({ ok: true, data: result });
  } catch (error) {
    return next(error);
  }
}

module.exports = { getRecommendation };
