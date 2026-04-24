const { app, config } = require("./app");

app.listen(config.port, () => {
  console.log(`Backend running on port ${config.port}`);
});
