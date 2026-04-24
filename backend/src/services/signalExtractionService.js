const { config } = require("../config/env");
const { OpenRouter } = require("@openrouter/sdk");

const MOOD_KEYWORDS = {
  low: ["low", "sad", "down", "upset"],
  happy: ["happy", "great", "excited", "joyful"],
  stressed: ["stressed", "anxious", "overwhelmed"],
  tired: ["tired", "sleepy", "drained"],
  neutral: [],
};

const CRAVING_KEYWORDS = {
  spicy: ["spicy", "hot", "masala", "chilli", "chili"],
  sweet: ["sweet", "dessert", "chocolate", "sugar"],
  sour: ["sour", "tangy", "chatpata"],
  salty: ["salty", "salt"],
  crunchy: ["crunchy", "crispy", "fried"],
  creamy: ["creamy", "cheesy", "rich"],
  light: ["light", "healthy", "simple"],
};

const ENERGY_KEYWORDS = {
  low: ["tired", "sleepy", "drained", "lazy"],
  high: ["energetic", "active", "hyped"],
  moderate: [],
};

function matchKeyword(text, map, fallback) {
  const normalized = text.toLowerCase();
  for (const [key, words] of Object.entries(map)) {
    if (words.some((word) => normalized.includes(word))) {
      return key;
    }
  }
  return fallback;
}

function parseJsonFromText(text) {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("No JSON object found in model output.");
  }
  return JSON.parse(text.slice(start, end + 1));
}

async function extractSignalsWithKey(input, apiKey) {
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: config.openAiModel,
      temperature: 0,
      input: [
        {
          role: "system",
          content:
            "Extract meal recommendation signals from user text. Return only JSON with keys: mood, craving, energy, context. Keep values lowercase words.",
        },
        {
          role: "user",
          content: input,
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI API error (${response.status}): ${errorText}`);
  }

  const payload = await response.json();
  const outputText = payload.output_text || "";
  const parsed = parseJsonFromText(outputText);

  return {
    mood: parsed.mood || "neutral",
    craving: parsed.craving || "spicy",
    energy: parsed.energy || "moderate",
    context: parsed.context || "unknown",
    rawInput: input,
    extractionSource: "openai",
  };
}

async function extractSignalsWithOpenRouter(input, apiKey) {
  const openrouter = new OpenRouter({ apiKey });
  const stream = await openrouter.chat.send({
    chatRequest: {
      model: config.openRouterFallbackModel,
      messages: [
        {
          role: "system",
          content:
            "Extract meal recommendation signals from user text. Return only JSON with keys: mood, craving, energy, context. Keep values lowercase words.",
        },
        {
          role: "user",
          content: input,
        },
      ],
      stream: true,
    },
  });

  let outputText = "";
  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content;
    if (content) {
      outputText += content;
    }
  }

  const parsed = parseJsonFromText(outputText);
  return {
    mood: parsed.mood || "neutral",
    craving: parsed.craving || "spicy",
    energy: parsed.energy || "moderate",
    context: parsed.context || "unknown",
    rawInput: input,
    extractionSource: "openrouter",
  };
}

async function extractSignals(input) {
  const primaryKey = config.openAiApiKey.trim();
  const fallbackKey = config.openRouterApiKey.trim();

  if (primaryKey) {
    try {
      return await extractSignalsWithKey(input, primaryKey);
    } catch (primaryError) {
      if (fallbackKey) {
        try {
          return await extractSignalsWithOpenRouter(input, fallbackKey);
        } catch (fallbackError) {
          console.warn("OpenAI and OpenRouter fallback failed, using keyword extraction.", {
            primaryError: primaryError.message,
            fallbackError: fallbackError.message,
          });
        }
      } else {
        console.warn("Primary OpenAI key failed and OpenRouter fallback is not configured.", {
          primaryError: primaryError.message,
        });
      }
    }
  } else if (fallbackKey) {
    try {
      return await extractSignalsWithOpenRouter(input, fallbackKey);
    } catch (fallbackError) {
      console.warn("OpenRouter fallback failed, using keyword extraction.", {
        fallbackError: fallbackError.message,
      });
    }
  }

  return {
    ...extractSignalsByKeywords(input),
    extractionSource: "keywords",
  };
}

function extractSignalsByKeywords(input) {
  const normalizedInput = input.toLowerCase();
  const mood = matchKeyword(input, MOOD_KEYWORDS, "neutral");
  const craving = matchKeyword(input, CRAVING_KEYWORDS, "spicy");
  const energy = matchKeyword(input, ENERGY_KEYWORDS, mood === "tired" ? "low" : "moderate");
  const context = normalizedInput.includes("rain") ? "rainy" : "unknown";

  return { mood, craving, energy, context, rawInput: input };
}

module.exports = { extractSignals };
