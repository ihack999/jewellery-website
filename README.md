# Toronto Jewels Curation Website

Static, Netlify-ready website for Toronto Jewels Curation with crawlable collection, category, product, custom-service, and trust pages.

## Pages
- `index.html` - homepage
- `shop.html` - crawlable collection grid with enhanced client-side filtering
- `rings/`, `necklaces/`, `bracelets/`, `earrings/` - indexable category landing pages
- `products/*/` - static, indexable product detail pages with Product structured data
- `customs.html` - custom-made consultation and jewellery editor page
- `custom-jewellery-toronto/` - custom jewellery service landing page
- `custom-engagement-rings-toronto/` - custom engagement ring landing page
- `curated-luxuries.html` - Estate Luxuries appointment catalogue
- `about.html` - brand story and direction
- `contact.html` - direct contact and inquiry form
- `jewellery-care.html`, `shipping-returns.html`, `privacy.html` - customer information and trust pages
- `404.html` - custom not-found page
- `robots.txt` and `sitemap.xml` - crawler discovery files

## Run Locally

No install step is required.

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

## Deploy to Netlify

This site is ready for static hosting on Netlify.

Option 1: Drag and drop deploy

```bash
zip -r jewellery-website-netlify.zip . -x ".git/*" ".github/*" "jewellery-website-netlify.zip"
```

Then upload the zip at `https://app.netlify.com/drop`.

Option 2: Import from GitHub

- Publish directory: `.`
- Build command: leave empty

## Twilio SMS Setup

The site can send an SMS after a successful form submission using a Netlify Function and Twilio.

Add these environment variables in the Netlify site settings before using SMS notifications:

- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_TO_PHONE` - destination phone number in E.164 format, for example `+14164518578`
- One of the following:
	- `TWILIO_FROM_PHONE` - your Twilio phone number in E.164 format
	- `TWILIO_MESSAGING_SERVICE_SID` - if you send through a Twilio Messaging Service

After adding the variables, redeploy the site from Netlify or with the Netlify CLI.

## Project Structure

```text
assets/
	css/styles.css
	js/main.js
	js/designer.js
	js/ar-tryon.js
	images/
netlify/
	functions/send-sms.js
index.html
shop.html
customs.html
curated-luxuries.html
about.html
contact.html
robots.txt
sitemap.xml
```

## Notes

- Canonical URLs, Open Graph URLs, structured data, `robots.txt`, and `sitemap.xml` currently use `https://torontojewelscuration.com`. Update them together if the production hostname changes.
- Product pages are static so names, descriptions, images, pricing, and links remain available without JavaScript. `assets/js/main.js` progressively adds galleries, saved pieces, comparison, and recently viewed tools.
- Legacy `product.html?slug=...` URLs are permanently redirected to clean `/products/.../` URLs in `netlify.toml`; the generic product shell is `noindex` as a fallback.
- The large custom design preview and AR modules load only when a visitor opens those features.
- Looping videos use poster images and begin loading near the viewport rather than on initial page load.
- The forms submit to Netlify and can email notifications through Netlify form hooks.
- SMS alerts require Twilio credentials in Netlify environment variables.
- Published-price pieces use a server-validated shopping bag and Stripe-hosted Checkout. Quote-only pieces continue to use the inquiry flow.

## Stripe Checkout Setup

Add `STRIPE_SECRET_KEY` to the Netlify site's environment variables with Functions scope, then redeploy. The browser never receives this secret. Test-mode keys create test-mode Checkout Sessions; use Stripe test card `4242 4242 4242 4242` with any future expiry and CVC when validating the flow.

The checkout catalogue and prices are enforced in `netlify/functions/checkout-catalog.js`. Keep that file in sync with published prices in `assets/js/main.js` whenever a price changes. CAD and USD pieces are checked out separately because a single payment has one settlement currency.
