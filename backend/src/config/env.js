const dotenv = require("dotenv");

dotenv.config();

const config = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT || 4000),
  openAiApiKey: process.env.OPENAI_API_KEY || "",
  openAiModel: process.env.OPENAI_MODEL || "gpt-4o-mini",
  openRouterApiKey: process.env.OPENROUTER_API_KEY || "",
  openRouterFallbackModel:
    process.env.OPENROUTER_FALLBACK_MODEL || "inclusionai/ling-2.6-1t:free",
  weatherApiKey: process.env.WEATHER_API_KEY || "",
  swiggyBaseUrl: process.env.SWIGGY_BASE_URL || "",
};

module.exports = { config };
