const express = require("express");
const cors = require("cors");
const { config } = require("./config/env");
const healthRoutes = require("./routes/healthRoutes");
const recommendationRoutes = require("./routes/recommendationRoutes");
const { errorHandler } = require("./utils/errorHandler");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/health", healthRoutes);
app.use("/api/recommendations", recommendationRoutes);

app.use(errorHandler);

module.exports = { app, config };
