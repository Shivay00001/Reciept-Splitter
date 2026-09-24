# Reciept-Splitter — AI receipt parsing & bill splitting demo

A Google AI Studio-style demo: snap a photo of a restaurant receipt, Gemini
(`gemini-2.5-flash`) extracts line items, tax and total, and a chat pane lets
you assign items to people in natural language. It shows a live per-person
summary with a proportional split of tax and tip.

(Yes, "Reciept" is misspelled in the repo name — kept as-is for continuity.)

## How to run

**Prerequisites:** Node.js 18+

1. Install dependencies: `npm install`
2. Copy `.env.example` to `.env` (or `.env.local`) and set
   `GEMINI_API_KEY=YOUR_GEMINI_API_KEY` to your real Gemini API key
   (get one at https://aistudio.google.com/app/apikey)
3. Run the dev server: `npm run dev` — opens on http://localhost:3000

## API key handling

- The Gemini key is **never hardcoded in source**. It is read only from the
  `GEMINI_API_KEY` environment variable at build time (`vite.config.ts`
  injects it as `process.env.API_KEY`).
- `.env` files are gitignored; `.env.example` contains only the placeholder
  `YOUR_GEMINI_API_KEY`.
- Client-side key note: because this demo calls the Gemini API directly from
  the browser bundle, the key you build with is visible to anyone who opens
  the built site. Use a key with strict API restrictions (HTTP referrer /
  quota limits) and treat it as public. For production use, move the Gemini
  calls to a server-side endpoint.
- Without a key, the app throws a clear error on load
  (`services/geminiConfig.ts`) instead of failing silently.

## Tests

`tests/test_smoke.py` asserts the Vite entry is wired (`index.html` loads
`/index.tsx`, `#root` mount exists) and all components are present.

## License

Apache-2.0 (see LICENSE).
