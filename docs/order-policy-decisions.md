# Ticket 01: order-policy decision inventory

Status: owner approved written confirmation before payment for all orders. The public checkout endpoint now rejects payment-session creation with HTTP 409 and an enquiry destination. Product and bag controls now open an enquiry with product names, listed unit prices, and quantities preserved. Existing draft fields and bag contents remain intact; ticket 01 remains in progress pending detailed terms and an approved-order payment process.

## Verified conflict

`shipping-returns.html` promises order-specific written terms before payment or commitment. `assets/js/main.js` sends only product slug and quantity to `netlify/functions/create-checkout-session.js`, which creates a Stripe payment session without a prior approval reference. The server catalogue enables nine products, including both estate pieces. A quantity limit of one does not verify estate availability across orders.

## Decisions needed before implementation

| Topic | Current implementation | Business decision needed |
|---|---|---|
| Payment milestone | Buy now and bag checkout take payment directly; policy promises written terms first. | Require a confirmed quote before payment, or define exactly which products/configurations qualify for immediate purchase? |
| Size and finish | Rise Ring and Half Eternity copy defer size until after checkout. Checkout collects no ring size or finish. | Confirm supported options, pricing consequences, and when the customer approves them. |
| Personalization | Stripe collects one shared initials field when any monogram ring is present, including multiple quantities. | Confirm whether each ring may have different initials and how each item's size/engraving is approved. |
| Price | Server charges fixed catalogue amounts; some storefront prices are labelled starting prices. | Define the included configuration and whether the amount is a full price or another explicitly agreed payment type. |
| Timing | Copy alternates between inquiry, order confirmation, and after checkout. | Confirm when a production estimate is issued and approved; do not invent delivery dates. |
| Delivery and charges | Function collects CA/US addresses; it does not explicitly configure shipping rates or automatic tax. Policy defers delivery details until shipping. | Confirm destinations, shipping/insurance charges, tax handling, duties, and what is included in the amount paid. Live Stripe settings remain unverified. |
| Changes and returns | Policy says eligibility is agreed before work begins, alongside its broader before-payment promise. Checkout carries no order-specific terms reference. | Supply actual cancellation, alteration, return, and refund terms for made-to-order and estate orders. |
| Estate availability | Estate copy promises direct confirmation before purchase, but both pieces are in the payment catalogue. | Confirm availability/reservation process and whether estate payment always follows direct review. |

## Recommended implementation direction

Retain the existing promise of written confirmation before payment unless the owner explicitly changes it. Route unconfirmed purchases into an order enquiry with the chosen product and quantity preserved. Payment should follow an approved order with its agreed configuration, total, timing, delivery, and applicable terms.

The owner accepted confirmation before payment for all orders. Detailed order terms and a server-verified confirmed-order payment mechanism remain to be defined. Client-supplied approval flags cannot authorize payment.

## Follow-up tickets within 01

1. Record the owner's payment milestone decision and actual terms in this document. Identify any products allowed immediate checkout.
2. Align one purchase path end to end: product action, bag, server eligibility, and preserved enquiry details. Reject unapproved payment requests on the server if confirmation is required; retain existing URLs and saved data.
3. Align policy, product ordering notes, static product copy, and checkout messaging with the approved behavior.
4. Verify direct Buy now, bag, direct API requests, estate items, and monogram quantities. Check desktop and phone layouts. Live payment delivery remains ticket 02.

## Evidence reviewed

- `shipping-returns.html`: introduction and timing, delivery, custom, and estate sections.
- `assets/js/main.js`: product shipping notes, `isPurchasable`, `startStripeCheckout`, product purchase controls, and bag footer.
- `netlify/functions/checkout-catalog.js`: nine payable products and quantity limits.
- `netlify/functions/create-checkout-session.js`: request validation, payment mode, address collection, initials field, and fixed line-item amounts.

Validation: source inspection and Node syntax check passed. Local handler assertions verified ordinary, malformed, estate, and forged-approval POST requests return 409; GET returns 405; no network call occurs. No live payment or external submission was made. Browser QA is pending with the enquiry UI subtask. Existing Stripe sessions are not revoked by this local change; deployment and production qualification remain pending.

## Enquiry handoff validation — 2026-09-12

- Changed `assets/js/main.js` and static ordering text in the Rise Ring, Half Eternity, and Monogram product pages.
- Desktop browser: direct product request, bag quantity 2, retained draft note and metal preference, repeat request without duplicated enquiry block.
- Phone browser at 390px: form and settled bag panel fit the viewport; confirmation action and no-payment message remain readable.
- Focused local assertions: malformed JSON, null/empty selections, unknown products, and excessive quantities leave the draft untouched; valid selections preserve notes and avoid duplicate generated blocks.
- Syntax and whitespace checks passed. No form was submitted and no deployment occurred. Live delivery, full policy alignment, and payment following approval remain pending.
