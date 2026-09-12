# Ticket 06a: primary journey accessibility audit

Audited 2026-09-12 with the isolated Chrome runner at 390×844. The audit emulated reduced motion, checked keyboard focus and Escape behavior, measured the primary enquiry controls at 200% page scale, and blocked external requests and submissions.

## Result

One focus defect was fixed in `assets/js/curation.js`: opening the personal finder now focuses its close control. Escape still closes the dialog and returns focus to the trigger.

The following checks passed:

- no horizontal overflow on Shop and Custom Made at the phone viewport;
- mobile navigation traps focus in the header while open, makes main content inert, and restores the menu trigger on Escape;
- finder and bag dialogs focus their close controls and restore their triggers;
- visible enabled controls remain pointer accessible;
- enquiry fields have accessible labels and the form status is announced with `role="status"` and polite live updates;
- reduced-motion emulation completed without runtime exceptions;
- 200% page scale kept the enquiry section and email control measurable.

The 200% check uses Chrome page scale as a lab proxy. It does not replace testing with browser text zoom, screen readers, iOS Safari, Android Chrome, or assistive technology. Those device checks remain open under ticket 06.

Validation:

```text
node scripts/check_journeys.mjs --accessibility
node scripts/check_journeys.mjs
python3 scripts/check_static.py
```

Results: 16 accessibility assertions, 41 journey assertions, 33 pages, 1,367 local references, 28 JSON-LD blocks, and zero runtime exceptions. No form submission, payment, camera access, or deployment occurred.
