# /store — your shop's content

Everything customers see comes from this folder. Edit, then run `npm run dev` (preview) or push (deploy).

| File / folder | What it controls |
|---|---|
| `site.json` | Brand name, colours, fonts, menu, announcement bar, footer, contact, trust badges, checkout mode, filter vocabulary, redirects |
| `home.json` | Homepage sections, top to bottom |
| `collections.json` | Category & collection pages (`/collections/<handle>/`) and which products they include |
| `products/<slug>/product.json` | One product. Photos go in the same folder. Start from `products/_template/` or run `npm run new -- "Name"` |
| `pages/<slug>.html` | Content pages at `/pages/<slug>/` |

**Add a product:** `npm run new -- "Product Name" --category rings --price 2500` → drop photos in the new folder → edit `product.json`.

Full guide: [../README.md](../README.md)
