# API Tester — Termux AI API Workbench

A local web dashboard to test AI API endpoints from Android Termux. Uses Node.js built-ins only: no npm dependencies, no GitHub app, no external dashboard.

## Features
- GET, POST, PUT, PATCH, DELETE and HEAD requests to HTTP/HTTPS APIs.
- Bearer API key and custom JSON headers.
- Request bodies for chat/completion and other API formats.
- HTTP status, latency, response body and headers.
- Detect quota/rate-limit headers when a provider returns them.
- List model IDs from OpenAI-compatible `/models` endpoints.
- Mobile-friendly interface; keys are not written to disk.

## 1000+ AI APIs
There is no fixed provider-count limit: you can test 1000+ endpoints one by one if you have their URLs and credentials. This tool does not provide API keys, grant free access, or bypass quotas. Providers may have different authentication, endpoint paths, and payload formats. Model listing works best with OpenAI-compatible APIs.

## Install in Termux
```bash
pkg update
pkg install nodejs git
git clone https://github.com/Kokushibu74/API-TESTER-.git
cd API-TESTER-
npm start
```
Open `http://127.0.0.1:8787` in your phone browser. Keep Termux open. Stop with Ctrl+C.

## Test an API
1. Paste the full endpoint URL (including `https://`).
2. Choose the HTTP method.
3. Add a Bearer key if the provider uses Bearer authentication.
4. Put extra headers in JSON, e.g. `{"Accept":"application/json","Content-Type":"application/json"}`.
5. For POST/PUT/PATCH, enter the provider's required body and press **Test API**.

### Example OpenAI-compatible chat request
Endpoint commonly resembles `https://api.example.com/v1/chat/completions`; use the actual endpoint from your provider.
Method: POST. Put the API key in the key field. Example body (replace `your-model`):
```json
{
  "model": "your-model",
  "messages": [{"role":"user","content":"Reply with: API test successful"}],
  "max_tokens": 30
}
```
Some APIs use different request formats; follow their documentation.

## Model list
In the model checker, enter a base URL such as `https://api.example.com/v1` or the full `/v1/models` endpoint. Add the key if required, then fetch models. IDs returned by the provider can be copied.

## Interpret results
- **2xx:** server reports success.
- **401/403:** key, permission, or auth method may be wrong.
- **404:** endpoint path may be wrong.
- **429:** often rate limit or quota.
- **5xx:** provider-side error.
- **Quota:** only available if returned by the API; the tool will not guess.

## Security
- Server binds to `127.0.0.1`, intended for use on this phone.
- Keys are not saved to files; they are sent to this local server then forwarded to the selected endpoint.
- Only use keys with trusted endpoints. Do not expose this server publicly.
- Common private IPv4/local hostnames are blocked, but this is a personal tool, not a hardened security gateway.
- Respect API terms and limits.

## Troubleshooting
- `node: command not found`: run `pkg install nodejs`.
- Dashboard won't open: ensure `npm start` is running and open `http://127.0.0.1:8787`.
- 401/403: verify the key and required authentication header.
- Unknown model-list format: use the request builder on the provider's documented model endpoint.

## Structure
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
