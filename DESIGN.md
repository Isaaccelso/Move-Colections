# Move Collections Design System

## Intent

Um cofre de museu contemporâneo: o visitante entra em uma sala quase preta onde pátina teal, metal envelhecido e luz de conservação enquadram cada item como artefato. A página deve parecer guardiã, precisa e discreta — nunca como uma transportadora corporativa ou uma loja de TCG.

## Color

Use apenas tokens semânticos em OKLCH.

```css
--color-bg: oklch(0.095 0 0);
--color-bg-soft: oklch(0.125 0.008 180);
--color-surface: oklch(0.155 0.012 180);
--color-surface-raised: oklch(0.205 0.018 180);
--color-ink: oklch(0.965 0.006 180);
--color-muted: oklch(0.74 0.018 180);
--color-primary: oklch(0.58 0.105 180);
--color-primary-strong: oklch(0.67 0.12 180);
--color-primary-fill: oklch(0.50 0.105 180);
--color-primary-fill-hover: oklch(0.46 0.11 180);
--color-metal: oklch(0.72 0.11 75);
--color-line: oklch(0.31 0.022 180);
--color-danger: oklch(0.64 0.19 25);
```

The background is neutral near-black; brand warmth lives in the aged-metal accent, not in cream surfaces. Primary teal owns imagery, focus, routes and section transitions. Filled CTAs use the deeper teal tokens so near-white text stays above 4.5:1. Metal is rare and reserved for decisive details.

## Typography

Schibsted Grotesk Variable is the only family. It feels engineered without defaulting to a generic startup sans. Body uses 400/450, labels 560, subheads 600 and display 300–420. Body remains `1rem`; headings use bounded fluid `clamp()` values. Display tracking never goes below `-0.035em`; body measure is capped at 68ch.

## Layout

Mobile-first with a 4 px spacing base and semantic steps of 8, 12, 16, 24, 32, 48, 64, 96 and 144 px. Hero uses an asymmetric two-column composition from 960 px; narrow screens place copy before imagery. Sections alternate full-bleed imagery, open text groupings and one horizontal protocol sequence. Avoid identical card grids and nested cards.

## Components

- Wordmark: inline SVG nested-sleeve mark plus text; never rasterized.
- Primary CTA: filled patina teal/metal treatment with white or near-black text chosen by contrast; 12 px radius maximum.
- Secondary CTA: text link with directional line, no pill.
- Protocol step: number, concise verb and detail separated by hairlines; the sequence is semantic ordered content.
- Quote form: visible labels, sectioned fields, inline errors, strong focus ring, loading and success feedback.
- FAQ: native `<details>` with generous hit areas and an animated chevron only when motion is allowed.

## Imagery

Original scenes only: generic cards, slabs and collectibles, black gloves, conservation trays and controlled task lighting. No franchise art, characters, logos, words, fake labels or trademarks. HTML/CSS owns borders, frames, captions, transforms and shadows.

## Motion

One 700 ms hero choreography uses clip/opacity/transform. Pointer tilt is capped at 2° and 6 px. Interaction transitions run 160–280 ms; layout changes stay below 400 ms. No scroll-jacking, bounce, elastic easing or global fade-on-scroll. `prefers-reduced-motion` removes all parallax and reduces transitions to near-instant.
