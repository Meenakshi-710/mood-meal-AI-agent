const CRAVING_TO_SUGGESTIONS = {
  sweet: ["gulab jamun", "chocolate shake", "ice cream"],
  spicy: ["spicy momos", "mirchi pakoda", "paneer tikka"],
  sour: ["chaat", "pani puri", "bhel puri"],
  salty: ["fries", "salted popcorn", "nachos"],
  crunchy: ["pakoda", "crispy corn", "fried momos"],
  creamy: ["alfredo pasta", "cheesecake", "malai kofta"],
  light: ["soup", "khichdi", "grilled sandwich"],
};

function moodToCategory(mood, weather) {
  if (mood === "low" && weather === "rainy") return "comfort_hot";
  if (mood === "tired") return "easy_digest";
  if (mood === "happy") return "indulgent";
  return "balanced";
}

function buildDecision({ mood, craving, weather, mealType }) {
  const category = moodToCategory(mood, weather);
  const suggestions = CRAVING_TO_SUGGESTIONS[craving] || CRAVING_TO_SUGGESTIONS.spicy;

  return {
    category,
    tasteProfile: craving,
    cuisine: "indian_street",
    mealType,
    suggestions,
  };
}

module.exports = { buildDecision };
