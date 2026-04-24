async function getWeatherContext({ location, fallbackContext }) {
  if (fallbackContext === "rainy") {
    return {
      condition: "rainy",
      source: "input-context",
      location: location || "unknown",
    };
  }

  return {
    condition: "clear",
    source: "mock",
    location: location || "unknown",
  };
}

module.exports = { getWeatherContext };
