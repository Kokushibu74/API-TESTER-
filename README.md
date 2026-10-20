# AI Model Checker — Termux

A simple mobile dashboard: **select an AI model, paste your API key, tap Check, and read the report.**

## Current provider support
This build uses **OpenRouter** as the unified provider. OpenRouter exposes a catalogue of 1000+ model choices through one API, so the app can populate the model selector automatically. It does not automatically identify arbitrary API keys from unrelated providers. A Google AI Studio key, OpenAI key, Groq key, and OpenRouter key are not interchangeable.

## What it checks
- Loads the live OpenRouter model catalogue and lets you search/select a model.
- Checks whether OpenRouter accepts the provided key.
- Checks whether the selected model appears in the account-visible catalogue.
- Sends a small real generation request to test model access.
- Reports HTTP status, response time, model response/error, token usage, and request ID when available.
- Shows quota/rate-limit headers only when the provider returns them.
- Displays model context and price metadata when the catalogue supplies it.
- Does not write the API key to a file or browser storage.

## Run on Android Termux
Install Node.js and Git:
```bash
pkg update
pkg install nodejs git
```
Clone and start:
```bash
git clone https://github.com/Kokushibu74/API-TESTER-.git
cd API-TESTER-
npm start
```
Open in your phone browser:
```text
http://127.0.0.1:8787
```
Keep Termux open while using it. Stop the server with Ctrl+C.

## Use it
1. Create or obtain an OpenRouter API key from the official OpenRouter account.
2. Open the local dashboard and wait for the model catalogue to load.
3. Search and select a model.
4. Paste the OpenRouter key.
5. Tap **Check key & test model**.
6. Read the report:
   - **PASS** means the key was accepted and the small generation test succeeded.
   - **KEY VALID · MODEL FAILED** means the key was accepted but the selected model call failed; check the error, account credits, provider availability, model access, and limits.
   - **FAILED** means the key was rejected or could not be verified.

The test sends a small prompt (“Reply with exactly: API_TEST_OK”) and may incur a small charge for paid models. Choose a model marked free in the provider's current catalogue if you want to avoid model usage charges; free availability can change. The tool itself is free and does not provide credits or keys.

## Important limits
- “1000+” means catalogue choices, not that every model is free or guaranteed to work.
- Token counts, prices, and quotas are displayed only when the provider returns them.
- Providers may hide remaining credits/quotas or report limits in a separate dashboard; this tool will not guess.
- This version uses OpenRouter keys only. Supporting direct provider keys requires a provider selection or separate adapters, because keys and API endpoints are not universally interchangeable.

## Security
- The server binds to `127.0.0.1` for local phone use.
- The key is sent to this local server and forwarded to OpenRouter for the check; it is not written to disk or browser storage.
- Never paste an API key into a site you do not trust, and do not expose the local server publicly.

## Troubleshooting
- **Model catalogue fails:** check internet access and retry “Reload models”.
- **401/403:** key may be invalid, disabled, or missing permissions.
- **402/429:** account credit, provider limits, or rate limits may be involved.
- **Model unavailable:** try another model or review the provider's availability.
- **Dashboard won't open:** check that `npm start` is still running, then open `http://127.0.0.1:8787`.

## Files
```text
API-TESTER-/
├── server.js
├── package.json
├── .gitignore
├── README.md
└── public/index.html
```

## License
MIT.
