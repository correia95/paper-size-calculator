# Paper Size Calculator

Look up ISO 216 (A-series) and US paper size dimensions in
millimeters, inches, and pixels at any DPI, and see how many smaller
sheets fit exactly inside a larger one.

- ISO 216 A0–A10 (exact millimeter spec) plus US Letter, Legal,
  Tabloid, and Executive
- Millimeter and inch dimensions, plus pixel dimensions at a chosen
  DPI (72/150/300/600 presets or custom)
- Exact "how many fit" math within the A-series, where each size is
  precisely double the area of the next — explicitly not applied to US
  sizes, which don't share that doubling relationship
- Shareable link (base64url-encoded)

## Develop

```
npm install
npm run dev
npm run build      # tsc --noEmit && vite build
node --experimental-strip-types --test src/paper.test.mjs
```

The engine (`getSize`, `mmToInches`, `mmToPixels`, `sheetsPerSheet`) is
in `src/paper.ts`. 14 Node tests in `src/paper.test.mjs`, including a
reference check against the well-known A4-at-300dpi pixel dimensions
(2480 × 3508).

## Deploy

Static assets on Cloudflare Workers (`wrangler.jsonc`). Live at
<https://paper-size-calculator.correia95.workers.dev/>.
