# Mood Meal Backend

Node.js backend for the Mood-to-Meal AI Agent MVP.

## Quick start

1. Install dependencies:
   - `npm install`
2. Create env file:
   - `cp .env.example .env`
3. Run server:
   - `npm run dev`

## Environment variables

- `OPENAI_API_KEY` (primary key)
- `OPENAI_MODEL` (default: `gpt-4o-mini`)
- `OPENROUTER_API_KEY` (fallback provider key)
- `OPENROUTER_FALLBACK_MODEL` (default: `inclusionai/ling-2.6-1t:free`)

## Endpoints

- `GET /api/health`
- `POST /api/recommendations`

### Sample request

```json
{
  "input": "I feel low and tired, craving something spicy, and it's raining",
  "location": "Bengaluru"
}
```
