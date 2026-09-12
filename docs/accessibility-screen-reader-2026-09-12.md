# Ticket 06b: accessibility-tree and text-scaling audit

Audited 2026-09-12 with disposable Chrome at 390×844. The runner inspected Chrome's accessibility tree on Home, Shop, The Rise Ring, and Custom Made, then applied 200% root text scaling to the visible Custom Made enquiry fields. External requests and submissions were blocked.

## Result

The accessibility tree exposed an unnamed visible `#dimensions` textbox on Custom Made even though its `label[for]` was present in the DOM. The field now has an explicit `aria-label="Ring Size or Dimensions"` fallback in `customs.html`.

Passed checks:

- all visible buttons, links, form controls, and headings on the four representative pages have accessible names;
- each page exposes an h1 and at least three landmark regions;
- the Custom Made enquiry remains horizontally contained at 200% text scaling;
- all visible enquiry controls remain measurable and at least 32px high at that scale;
- no runtime exceptions, submissions, payment requests, camera use, or deployment.

Validation:

```text
node scripts/check_journeys.mjs --screen-reader
node scripts/check_journeys.mjs --accessibility
node scripts/check_journeys.mjs
python3 scripts/check_static.py
```

Results: 15 accessibility-tree/text-scaling assertions, 16 keyboard/reduced-motion assertions, 41 journey assertions, 33 pages, 1,367 local references, 28 JSON-LD blocks, and zero runtime exceptions.

The 200% check is a browser lab proxy using root text scaling. It does not replace native browser text zoom, screen readers, iOS Safari, Android Chrome, or real assistive-technology testing. Those checks remain open under ticket 06.
