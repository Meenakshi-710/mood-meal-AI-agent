const { extractSignals } = require("./signalExtractionService");
const { getTimeContext } = require("./timeContextService");
const { getWeatherContext } = require("../tools/weatherTool");
const { searchRestaurants, getMenu } = require("../tools/swiggyTool");
const { buildDecision } = require("./decisionEngineService");

async function buildRecommendation({ input, location }) {
  const extracted = await extractSignals(input);
  const timeContext = getTimeContext(new Date());
  const weather = await getWeatherContext({ location, fallbackContext: extracted.context });

  const decision = buildDecision({
    mood: extracted.mood,
    energy: extracted.energy,
    craving: extracted.craving,
    weather: weather.condition,
    mealType: timeContext.mealType,
  });

  const restaurants = await searchRestaurants({
    query: decision.category,
    tasteProfile: decision.tasteProfile,
    location,
  });

  const topRestaurant = restaurants[0] || null;
  const menu = topRestaurant ? await getMenu(topRestaurant.id) : [];

  return {
    extracted,
    context: {
      weather,
      time: timeContext,
    },
    decision,
    restaurants,
    menu,
    recommendationText:
      topRestaurant && menu.length
        ? `Since you're feeling ${extracted.mood} and craving ${decision.tasteProfile}, try ${menu[0].name} from ${topRestaurant.name}.`
        : `You're feeling ${extracted.mood} and craving ${decision.tasteProfile}. Try ${decision.suggestions.join(", ")}.`,
  };
}

module.exports = { buildRecommendation };
