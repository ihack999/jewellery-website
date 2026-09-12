# Ticket 06c: native browser coverage

## Native Chrome

Inspected the local Custom Made page in a native Chrome tab on 2026-09-12. The browser accessibility tree exposed:

- a named main heading and section headings;
- named navigation, consultation, request, and footer regions;
- named appointment fields, radios, checkbox, date controls, enquiry fields, upload control, and submit button;
- the corrected `Ring Size or Dimensions` name on the dimensions field;
- the enquiry status and saved-draft messages as readable text.

The page was reviewed without submitting a form, starting payment, or using camera access. The browser tab remained local.

## Coverage boundary

Safari control timed out in the current environment, and no Android device or native mobile Safari session was connected. Native browser zoom was not certified from those platforms. The local Chrome accessibility-tree and text-scaling audits remain the repeatable evidence:

```text
node scripts/check_journeys.mjs --screen-reader
node scripts/check_journeys.mjs --accessibility
```

This is partial ticket 06c coverage. Full iOS Safari, Android Chrome, VoiceOver/TalkBack, and native browser text-zoom qualification still require authorized device access.
