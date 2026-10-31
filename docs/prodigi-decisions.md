# Prodigi print integration: decisions

Judgment calls made while building the photo print integration, with the evidence behind them. Each PR in the stack appends its own section.

## Provider API access (PR 2)

- Client: the unofficial `prodigi-print-api` 1.3.0 is used for orders, quotes and products. Verified against both the sandbox and live APIs: product lookups, quotes, order creation, order retrieval and order cancellation all returned data matching its types. It only accepts `sandbox` or `production`, so the environment is derived from the host in `PRODIGI_BASE_URL` (`api.sandbox.prodigi.com` or `api.prodigi.com`); any other host throws rather than defaulting.
- SSM parameters: `fourtiesnyc-dev-prodigi-{base-url,sk}` (sandbox) and `fourtiesnyc-production-prodigi-{base-url,sk}` (live) exist. **`fourtiesnyc-staging-prodigi-*` do not exist**, and `serverless.yml` now references them, so a staging deploy fails until they are created. Point staging at the sandbox base URL.
- Live order guard: `ProdigiService.createOrder` throws unless the base URL is the sandbox host or `PRODIGI_LIVE_ORDERS_ENABLED=true`. The variable is not set anywhere. Covered by `ProdigiService.test.ts` and `prodigiConfig.test.ts`. Live API use during development was limited to product lookups and quotes.
- Callback authentication: Prodigi callbacks are unsigned. Each order's callback URL is `/prodigi-webhooks/<merchOrderId>/<token>` where the token is an HMAC-SHA256 of the order id keyed with the existing `JWT_SECRET`, so no new secret is needed. The handler checks the token in constant time, requires the callback's Prodigi order id to match the one stored on that merch order, and then re-fetches the order from Prodigi with our API key; only the fetched order is used to update state. Callback delivery cannot be received by local dev (not publicly reachable), so local testing polls instead.
- Status mapping (`ProdigiToMerchOrderStatusMap.ts`): Cancelled -> canceled, Complete -> fulfilled, asset download or preparation error -> failed, any issue on the order -> on hold, any dispatched shipment on an in-progress order -> partial, assets not yet downloaded -> pending, otherwise in progress. Prodigi has no draft state, so the Prodigi provider never reports `draft`.
- Shipments: every Prodigi shipment with a dispatch date is recorded with its id, carrier, tracking URL and tracking number, and each new shipment sends one shipped email.

## Product catalog (PR 2)

- Photos in the 1940s collection are 2800x4200 pixels (exactly 2:3). Checked on 25 random photos from the dev database: all identical. All catalog print areas are 2:3 as well (1200x1800 and 2400x3600), so nothing is cropped or padded.
- Sizing: every product uses `fitPrintArea`. The Prodigi API accepts exactly `fillPrintArea` (crop), `fitPrintArea` (whole image kept, white margin if ratios differ) and `stretchToPrintArea` (distorts); any other value, such as `ShrinktoFit`, is rejected with `MustBeInAllowedValues` (verified in the sandbox). `fitPrintArea` is a no-op for 2:3 products and is the safe fallback if a product's ratio ever differs. A unit test fails if any product uses another mode or a non-2:3 print area. Prodigi auto-rotates between portrait and landscape, so a landscape photo on a portrait product is also not cropped.
- Paper family: `PRINT_PAPER_FAMILY` in `backend/src/business/prodigi/printCatalog.ts` is the single switch (`HPR`, `FAP` or `PHO`). Variants exist for every family (`print-hpr-4x6`, `print-fap-8x12`, `print-pho-4x6`, and so on) so internal ids always say what is sold; changing the constant changes which family is offered, and Stripe products and prices must exist for the chosen family. `PHO` uses the Professional C-Type SKUs (`GLOBAL-PHO-4X6-PRO`, `GLOBAL-PHO-8X12-PRO`) with the lustre finish.
- Framed print: Prodigi has no box frame at 4x6 or 8x12. Box frame sizes are 5x7, 6x8, 11x14, 12x12, 12x16, 16x16, 16x20, 18x24, 20x20, 20x28 and 24x32, and none is 2:3 (the closest ratios are 5x7 and 20x28 at 1:1.4). All box frames use EMA paper (the `FAP` family), so the same-paper requirement is only met when the paper family is `FAP`. The catalog uses the classic frame `GLOBAL-CFP-8X12` in black instead (EMA paper, 8x12, 2:3 print area, $37 item cost), because it is the only framed product that shows the whole photo with no margin. This departs from the request for a box frame; it is one catalog entry to change. If a box frame is preferred, `GLOBAL-BOX-20X28` or `GLOBAL-BOX-5X7` with `fitPrintArea` would leave a white margin on the long side. Sandbox and live catalogs matched for every SKU checked.
- Framed prints are always EMA paper, so the framed variant is `print-fap-8x12-framed` regardless of the paper family constant.
- Attributes: single-valued attributes need no value. `GLOBAL-CFP-8X12` requires `color`, set to `black`; `GLOBAL-PHO-*-PRO` requires `finish`, set to `lustre`. `scripts/prodigiSmoke.ts` fails if any attribute with several values is left unset.

## Shipping (PR 2 findings, used in PR 3)

- Stripe cannot compute live carrier rates natively. Prodigi's `POST /v4.0/quotes` returns exact per-method costs for a destination country, so PR 3 builds Checkout `shipping_options` with inline `shipping_rate_data` from a quote at session creation.
- Quotes are higher than the public pricing CSV (for example Budget 6.85 versus 5.95 for a print), and the framed print is much higher (Budget 24.80). The quote is the source of truth.
- Prodigi applies US sales tax to some orders and says quotes exclude it.

## Open items for the user

- Create `fourtiesnyc-staging-prodigi-base-url` and `fourtiesnyc-staging-prodigi-sk` in SSM.
- Confirm or reject the classic frame instead of a box frame.
