# Red Apple Distribution - design direction

**Business:** US wholesale distributor to smoke shops (vapes, THC-P, THC-A, hydroxys, pre-rolls, flower). Audience: shop owners who order in bulk and want range, speed and one rep.

**Direction:** bold poster-like home page. Deep burgundy and warm ivory, condensed uppercase headlines with one italic serif accent word, real product photography in motion.

## Palette (user supplied: burgundy #790B13, ivory #FFF0DC)
| Token | Value | Use |
|---|---|---|
| --burgundy | #790B13 | main surface, text on ivory |
| --ivory | #FFF0DC | text on burgundy, light sections, primary buttons |
| --burgundy-deep | #4E070C | product panel, nav plate, ticker, footer, text on ivory |
| --burgundy-2 | #8C1520 | hover and raised surface |
| --ivory-2 | #F6E3C6 | cards on ivory |
Accent italic word on burgundy: #E9CFAF. Ivory on burgundy contrast is about 9.9:1. Sections alternate burgundy and ivory.

## Type
- Display: Barlow Condensed 500, uppercase, tight leading (.92-.95). Sizes: hero clamp(56px, 8.2vw, 134px), section titles clamp(44px, 6vw, 92px).
- Accent: Instrument Serif italic, lowercase, one word per headline ("sells.", "We source it.").
- Body and UI: DM Sans 400/500, 17px body, about 65 characters per line.
- Never bold the display face. No em or en dashes anywhere in copy.

## Components
- Buttons: pills, 52px high. Primary ivory with burgundy text. Secondary ivory outline.
- Logo: the real logo on a dark burgundy plate (never recolored).
- Hero: burgundy left, deep-burgundy diagonal product panel on the right with three rows of different products sliding in opposite directions. Phones stack the panel under the copy. Ticker along the bottom.

## Motion (purpose: delight on the rare first view, feedback on hover)
- One hero entrance, one scroll reveal, one staggered tile reveal.
- Hero rows drift and speed up with the pointer (transform only). Hover lifts a product.
- Ticker is CSS. Reduced motion: rows and ticker stop, content shows immediately.

## Copy rules
- Age notice only in the age gate and the footer. No repeated minimum-order, sign-in or shipping lines.
- Each fact appears once on a page. Plain, short sentences.

## Imagery
- Products: transparent cutouts only, 10 distinct per row, no repeats on screen. Categories photography for tiles.
