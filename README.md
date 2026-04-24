# Mood-to-Meal AI Agent

## 1) Executive Summary

Mood-to-Meal AI Agent is a context-aware recommendation platform that helps users decide what to eat based on:

- mood (low, happy, stressed, tired, etc.)
- craving (spicy, sweet, sour, crunchy, creamy, light)
- context (time of day, weather, location)

The system uses an LLM-backed extraction pipeline with provider failover, applies a decision engine, and returns personalized meal suggestions with restaurant candidates.

## 2) Problem Statement

Food discovery apps are optimized for search and listings, not intent understanding. Users still face:

- decision fatigue when they "don’t know what to eat"
- poor translation of emotional state to relevant food options
- lack of context-aware recommendations (weather/time/mood combinations)

## 3) Product Vision and Goals

### Vision

Build a conversational food intelligence layer that converts intent into action:

`feeling + craving + context -> meal recommendation -> restaurant options -> order-ready path`

### Primary Goals

- reduce decision time for food selection
- improve recommendation relevance using mood + craving + context
- provide a reusable backend orchestration layer for mobile and web clients
- support resilient inference via model-provider fallback

### Non-Goals (Current Scope)

- real-time delivery partner fulfillment
- payments and checkout
- user-generated social feed

## 4) Users and Key Use Cases

### Target Users

- students and working professionals making daily meal decisions
- users looking for comfort/emotion-driven food choices
- users who prefer guided recommendations over manual browsing

### Core Use Cases

- "I feel low and want something spicy"
- "It’s raining and I need warm comfort food"
- "I’m tired at night and want something light"

## 5) Functional Requirements

1. Accept natural-language input from user.
2. Extract mood, craving, energy, and context intent.
3. Enrich with time context and weather context.
4. Convert signals into recommendation strategy (category/taste/cuisine/suggestions).
5. Query restaurant/menu layer (mock now, real provider later).
6. Return structured response and final recommendation text.
7. Implement extraction failover:
   - primary: OpenAI
   - secondary: OpenRouter model
   - final fallback: deterministic keyword rules

## 6) Non-Functional Requirements

- Reliability: graceful degradation if provider/API fails.
- Security: no secret keys in git history; `.env` ignored.
- Performance: target P95 response under 3-5s in MVP.
- Observability: basic logs for extraction source and failures.
- Deployability: cloud-ready backend with health endpoint.

## 7) System Architecture

```text
React Native App
      |
      v
Node.js/Express Backend
      |
      v
Recommendation Orchestrator
  |          |           |
  v          v           v
LLM Extraction  Context Service  Decision Engine
 (OpenAI -> OpenRouter -> Rules)
      |
      v
Restaurant/Menu Tool Layer (Mock now, Swiggy MCP/API later)
```

## 8) Backend API Contract

### Health Check

- **Method**: `GET`
- **Path**: `/api/health`
- **Purpose**: deployment/runtime health verification

Example response:

```json
{
  "ok": true,
  "service": "mood-meal-backend",
  "message": "Service is healthy"
}
```

### Recommendation Endpoint

- **Method**: `POST`
- **Path**: `/api/recommendations`
- **Request body**:

```json
{
  "input": "I feel low and tired, craving something spicy",
  "location": "Bengaluru"
}
```

- **Response shape**:
  - extracted signals (`mood`, `craving`, `energy`, `context`, `extractionSource`)
  - enriched context (`weather`, `time`)
  - decision output (`category`, `tasteProfile`, `mealType`, `suggestions`)
  - restaurant/menu candidates
  - recommendation text

## 9) Intelligence Design

### Signal Extraction

- Primary model: OpenAI (`OPENAI_API_KEY`)
- Fallback model: OpenRouter (`OPENROUTER_API_KEY`, `OPENROUTER_FALLBACK_MODEL`)
- Fail-safe: keyword mapping rules for continuity

### Craving Taxonomy (MVP)

- sweet
- spicy
- sour
- salty
- crunchy
- creamy
- light

### Decision Mapping (MVP)

- mood + weather -> recommendation category
- craving -> taste profile + suggestion list
- hour of day -> meal type (breakfast/lunch/evening-snack/dinner/snack)

## 10) Data and Integrations

### Current (MVP)

- mock restaurant search and menu tools
- deterministic weather fallback context

### Planned

- weather API integration (live condition)
- Swiggy MCP/API integration:
  - `searchRestaurants`
  - `getMenu`
  - `createCart`
  - `placeOrder`

## 11) Deployment and Environment

### Hosting

- Backend deployed on Render
- health URL validates live deployment

### Required Environment Variables

- `PORT`
- `NODE_ENV`
- `OPENAI_API_KEY`
- `OPENAI_MODEL`
- `OPENROUTER_API_KEY`
- `OPENROUTER_FALLBACK_MODEL`
- `WEATHER_API_KEY` (optional in MVP)
- `SWIGGY_BASE_URL` (placeholder until real integration)

## 12) Delivery Roadmap

### Phase 1 - MVP Foundation (Completed)

- backend scaffolding (Express + routes + services)
- health and recommendations API
- extraction + decision pipeline
- provider fallback and safe degradation
- cloud deployment

### Phase 2 - Real Integrations

- plug in live weather API
- replace mock restaurant layer with Swiggy MCP/API adapter
- add ranking filters (rating, ETA, cost)

### Phase 3 - Personalization

- user preference memory
- meal history feedback loop
- budget-aware and health-aware recommendation constraints

### Phase 4 - Agentic Commerce Expansion

- cart building and order placement workflow
- proactive suggestions (time, weather, routine-based)
- voice/chat assistant capabilities

## 13) Risks and Mitigation

- **LLM provider quota/rate limits** -> multi-provider fallback + keyword backup
- **Secrets leakage risk** -> strict `.gitignore`, `.env.example` only
- **Integration volatility** -> adapter-based tool layer for Swiggy/weather
- **Cold-start latency (cloud)** -> lightweight health checks and monitoring

## 14) Success Metrics (MVP to Scale)

- API uptime and health check success rate
- recommendation API success rate (`ok: true`)
- median and P95 latency
- extraction source distribution (OpenAI/OpenRouter/keywords)
- user feedback score on recommendation relevance

## 15) Immediate Next Actions

1. Integrate React Native frontend with `POST /api/recommendations`.
2. Add request validation and standardized error schema.
3. Add basic analytics logging (latency, extraction source, failures).
4. Implement real weather and restaurant connectors.
5. Prepare demo script and sample scenarios for stakeholder review.
