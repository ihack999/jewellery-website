# Jewellery Website

Minimal static site scaffold for a jewellery brand concept inspired by a white, silver, and deep-blue editorial luxury direction.

## Pages
- `index.html` - homepage
- `shop.html` - curated collection grid with category filtering
- `product.html` - reusable product detail page powered by a `slug` query parameter
- `customs.html` - bespoke consultation-style custom request page
- `about.html` - brand story and direction
- `contact.html` - direct contact and inquiry form

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
	images/*.svg
netlify/
	functions/send-sms.js
index.html
shop.html
product.html
customs.html
about.html
contact.html
```

## Notes

- The site uses local SVG artwork as polished placeholders for product and editorial imagery.
- Replace the placeholder SVG files in `assets/images/` with final photography and brand assets when available.
- The forms submit to Netlify and can email notifications through Netlify form hooks.
- SMS alerts require Twilio credentials in Netlify environment variables.
- Cart interactions are still UI-only and need a checkout integration if you want live purchasing.