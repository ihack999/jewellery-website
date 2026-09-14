# Ivory photography system — 14 September 2026

The collection now opens with matching ivory studio imagery instead of a mixture of studio renders, outfit photographs and phone close-ups. The user selected **matching ivory studio product shots**, retaining the existing worn images in each gallery.

Seventeen edited studio visuals cover all twelve catalogue pieces and the five additional estate/archive items. The visual direction uses warm ivory, diffuse daylight, restrained reflections, square frames and generous negative space. Some pieces use a close detail view because the reference does not show a full product or clasp.

[View the complete studio contact sheet](studio-image-contact-sheet.jpg).

The gallery captions identify these as **AI-restyled studio visuals**. These are photographic interpretations and do not establish exact dimensions, gemstone characteristics, authenticity or estate condition. Every original catalogue photograph remains available in its gallery at source resolution. Estate entries link to original condition photographs; the ring and sold handbag retain their original videos behind an explicit play/view interaction. Worn photographs, customer imagery and existing editorial artwork retain their original content and colour.

All 17 input photographs were compared with their Git source bytes and remain unchanged. Original generated PNGs are retained in the project. The original generation outputs also remain in the default Codex image directory.

The edits used the **built-in image_gen tool**. Each image had its own reference and prompt. [Exact prompt set, input paths, generated paths and final asset paths](studio-image-prompts.json). Pillow was used only for inspection sheets, orientation handling, sizing and WebP encoding; no jewellery retouching was performed by the conversion scripts.

| Studio asset | Display export | Retained PNG | 320px WebP |
| --- | --- | --- | ---: |
| Rise | [WebP](../assets/images/studio/rise-ring-polished.webp) | [PNG](../assets/images/studio/sources/rise-ring-polished.png) | 6,296 B |
| Monogram | [WebP](../assets/images/studio/signature-monogram-ring.webp) | [PNG](../assets/images/studio/sources/signature-monogram-ring.png) | 4,854 B |
| Half Eternity | [WebP](../assets/images/studio/half-eternity-pinky-band.webp) | [PNG](../assets/images/studio/sources/half-eternity-pinky-band.png) | 5,542 B |
| Oval Bracelet | [WebP](../assets/images/studio/oval-bezel-diamond-bracelet.webp) | [PNG](../assets/images/studio/sources/oval-bezel-diamond-bracelet.png) | 11,136 B |
| Hand Chain | [WebP](../assets/images/studio/diamond-hand-chain.webp) | [PNG](../assets/images/studio/sources/diamond-hand-chain.png) | 3,600 B |
| Graduated Necklace | [WebP](../assets/images/studio/graduated-diamond-necklace.webp) | [PNG](../assets/images/studio/sources/graduated-diamond-necklace.png) | 4,654 B |
| Estate Halo | [WebP](../assets/images/studio/estate-cushion-halo.webp) | [PNG](../assets/images/studio/sources/estate-cushion-halo.png) | 14,146 B |
| Blue Ring | [WebP](../assets/images/studio/rare-blue-diamond-ring.webp) | [PNG](../assets/images/studio/sources/rare-blue-diamond-ring.png) | 6,406 B |
| Tennis Necklace | [WebP](../assets/images/studio/diamond-tennis-necklace.webp) | [PNG](../assets/images/studio/sources/diamond-tennis-necklace.png) | 4,904 B |
| Tennis Bracelet | [WebP](../assets/images/studio/quiet-power-tennis-bracelet.webp) | [PNG](../assets/images/studio/sources/quiet-power-tennis-bracelet.png) | 4,706 B |
| Yellow Earrings | [WebP](../assets/images/studio/yellow-diamond-oval-studs.webp) | [PNG](../assets/images/studio/sources/yellow-diamond-oval-studs.png) | 12,788 B |
| Cushion Ring | [WebP](../assets/images/studio/cushion-cut-diamond-ring.webp) | [PNG](../assets/images/studio/sources/cushion-cut-diamond-ring.png) | 5,748 B |
| Patek Watch | [WebP](../assets/images/studio/patek-philippe-detail.webp) | [PNG](../assets/images/studio/sources/patek-philippe-detail.png) | 18,416 B |
| Piaget Watch | [WebP](../assets/images/studio/piaget-detail.webp) | [PNG](../assets/images/studio/sources/piaget-detail.png) | 15,210 B |
| Royal Oak Watch | [WebP](../assets/images/studio/royal-oak-detail.webp) | [PNG](../assets/images/studio/sources/royal-oak-detail.png) | 14,158 B |
| Emerald Floral Earring | [WebP](../assets/images/studio/emerald-floral-earring.webp) | [PNG](../assets/images/studio/sources/emerald-floral-earring.png) | 7,828 B |
| White Birkin | [WebP](../assets/images/studio/white-birkin.webp) | [PNG](../assets/images/studio/sources/white-birkin.png) | 10,886 B |

`assets/css/photography.css` supplies matching square catalogue frames, uncropped product detail, consistent thumbnails and neutral estate media. Compare controls sit below the product content so they no longer cover jewellery on small screens. Original photos use their original colours; hover saturation changes were removed from these media surfaces. The earlier interactive atelier and editor remain in place.

The responsive builder now accepts WebP sources, reads studio variants directly from retained PNG masters to avoid double compression, supplies missing intrinsic image dimensions and produces compact video posters. `data-poster-source` preserves the original poster identity on rebuild. `data-responsive-manual` preserves intentionally authored image sets, including the existing high-resolution 3D-atelier artwork. No raster image is upscaled beyond its supplied source resolution by the optimizer.

All 77 referenced photographs/posters have responsive derivatives. For the same twelve catalogue covers at **320px width**, file totals changed from **160,496 B to 84,780 B**, about **47% less**. The five video posters total **181,790 B**, compared with **686,517 B** for their source files. These are asset byte comparisons, not a production speed score. Source PNG masters never load in normal catalogue browsing. [Measured asset inventory](photography-audit.json).

Product social previews, Product JSON-LD image lists and the image sitemap include the studio covers while retaining original gallery images. Static product/category fallbacks use the same covers; product pages still provide original-photo links without JavaScript.

Validation: the photography browser suite passes 71 assertions, the mobile storefront suite passes 221, and shopping journeys pass 41 with no runtime errors. Photography checks exercise all twelve product galleries, full-resolution original views, quick view captions, saved-piece images, 320/390/1440px layouts, uncropped frames, controls clear of jewellery, all seven estate covers, WebP posters and a product page with JavaScript disabled. Static validation passes for 34 pages, 2,330 local references and 29 JSON-LD blocks. Screenshots were reviewed on desktop and phone emulation. Physical iPhone Safari remains unqualified.

Rebuild using the existing Pillow environment:

```sh
python scripts/import_studio_images.py
python scripts/optimize_storefront_images.py
node scripts/check_journeys.mjs --photography
```

The import script uses retained local PNGs when present and copies a generated output only for a newly approved entry. Existing original photography is never overwritten. Keep the prompt manifest and master PNG with each future addition, and review every generated interpretation against its source before using it.

All changes are local. No camera access, live submissions, payments or deployment occurred.
