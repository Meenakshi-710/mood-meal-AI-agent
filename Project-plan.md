Great addition—this actually makes your agent **much more realistic and product-ready**. I’ve updated your documentation to include **craving-based personalization** in a clean way 👇

---

# 📄 Mood-to-Meal AI Agent

### Context-Aware + Craving-Based Food Recommendation System

---

## 🧠 1. Overview

The **Mood-to-Meal AI Agent** is an intelligent, agent-based system that generates **personalized food recommendations** based on a user’s **mood, cravings, and contextual signals**.

It combines **LLM reasoning + external APIs** (weather, time, and Swiggy MCP APIs) to dynamically interpret user intent and execute end-to-end workflows—from understanding emotions and cravings to recommending restaurants and enabling ordering.

---

## 🎯 2. Objective

* Reduce decision fatigue in food selection
* Provide **hyper-personalized recommendations** (mood + craving + context)
* Bridge the gap between *intent → craving → decision → action*
* Build a real-world **agentic AI system with dynamic tool usage**

---

## 🚧 3. Problem Statement

Users often struggle with:

* Deciding what to eat
* Translating **mood + cravings** into food choices
* Finding relevant options quickly

Current platforms:

* Don’t capture **taste-level intent** (sweet, spicy, tangy, etc.)
* Lack emotional + contextual intelligence

---

## 💡 4. Proposed Solution

An AI agent that:

1. Understands **mood + cravings** from natural language
2. Enriches context using:

   * Weather
   * Time of day
3. Maps:

   * Mood → food type (comfort, light, indulgent)
   * Craving → taste profile (sweet, spicy, sour, crunchy, etc.)
4. Fetches relevant options via MCP APIs
5. Returns a curated recommendation

---

## ⚙️ 5. System Architecture

```text
React Native Frontend
        ↓
Node.js Backend
        ↓
Agent Layer (LLM + Tools)
        ↓
-------------------------------------
| External APIs                     |
| - Weather API                     |
| - Time Context                    |
| - Swiggy MCP APIs                 |
-------------------------------------
```

---

## 🧩 6. Core Components

### 6.1 Frontend (React Native)

* Input: mood + craving (explicit or implicit)
* Displays suggestions

---

### 6.2 Backend (Node.js)

* Handles orchestration
* Integrates APIs
* Manages agent workflow

---

### 6.3 Agent Layer (Core Intelligence)

Responsible for:

* Mood detection
* Craving detection
* Context reasoning
* Tool execution

---

## 🔄 7. Agent Workflow

### Step 1: User Input

```text
“I feel low, tired, craving something spicy, and it’s raining”
```

---

### Step 2: Mood + Craving Extraction (LLM)

```json
{
  "mood": "low",
  "energy": "tired",
  "craving": "spicy",
  "context": "rainy"
}
```

---

### Step 3: Context Enrichment

* Weather API → confirm rain
* Time → meal type

---

### Step 4: Decision Engine

Combines **mood + craving + context**:

```json
{
  "category": "comfort_hot",
  "taste_profile": "spicy",
  "cuisine": "indian_street",
  "suggestions": ["spicy momos", "masala chai", "mirchi pakoda"]
}
```

---

### Step 5: MCP Tool Execution

* Search restaurants
* Match dishes with taste profile
* Filter by rating, delivery time

---

### Step 6: Final Output

> “Since you’re feeling low and it’s raining, something warm and spicy would be perfect. I suggest spicy momos or mirchi pakoda with chai from XYZ.”

---

## 🧠 8. Craving Intelligence Layer (NEW)

The system introduces a **taste-profile mapping layer**:

### Supported Cravings:

* Sweet 🍰
* Spicy 🌶️
* Sour 🍋
* Salty 🧂
* Crunchy 🍟
* Creamy 🧀

---

### Example Mapping:

| Craving | Food Examples                |
| ------- | ---------------------------- |
| Sweet   | desserts, shakes, chocolates |
| Spicy   | momos, biryani, street food  |
| Sour    | chaat, pani puri             |
| Crunchy | fries, pakoda                |
| Creamy  | pasta, desserts              |

---

### Combined Intelligence Example:

| Mood  | Craving | Weather | Output            |
| ----- | ------- | ------- | ----------------- |
| Low   | Spicy   | Rainy   | Hot spicy snacks  |
| Happy | Sweet   | Sunny   | Ice cream, shakes |
| Tired | Light   | Night   | Soup, khichdi     |

---

## 🔌 9. MCP Integration Strategy

Swiggy MCP APIs are wrapped as **agent tools**:

* `searchRestaurants(query, tasteProfile)`
* `getMenu(restaurantId)`
* `createCart(items)`
* `placeOrder(cartId)`

---

## 🧰 10. Tech Stack

* Frontend: React Native
* Backend: Node.js
* LLM: OpenAI / equivalent
* APIs:

  * Swiggy MCP
  * Weather API
  * Time context

---

## 🚀 11. Development Phases

### Phase 1 (MVP)

* Mood + craving detection
* Mock data

### Phase 2

* MCP integration
* Real restaurant data

### Phase 3

* Personalization
* Predictive cravings

---

## 🔮 12. Future Enhancements

* Spotify-based mood detection
* Habit learning (user taste profile)
* Budget-aware suggestions
* Voice assistant
* Auto-ordering

---

## 📈 13. Impact

* Highly personalized experience
* Faster decisions
* Better user satisfaction
* Strong use case for **AI + commerce integration**

---

## ✅ Conclusion

By combining **mood + craving + context**, this system goes beyond traditional recommendation engines and delivers a **human-like, intuitive food decision experience** powered by agentic AI.

---

If you want next, I can:

* Turn this into a **presentation (PPT for manager/demo)**
* Add **UI screens + flows**
* Or give you **actual code for craving + mood extraction**
