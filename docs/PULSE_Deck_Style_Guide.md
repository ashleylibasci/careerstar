# PULSE Deck — Style Guide

A working style guide for presentation slides. The rules below are what keep a deck
readable on a projector, accessible to screen readers, and editable by whoever inherits it.

---

## Colors

| Swatch | Hex | Use |
|---|---|---|
| Deep teal | `#013D5B` | Primary. Headers, box fills, and the default text color. |
| Near-black navy | `#00132B` | Dark bands, contrast headers, emphasis boxes. |
| Pale teal | `#D6E8EA` | Background tints, image placeholders, soft fills. |
| Muted grey | `#666666` | Subtitles, footers, source lines, secondary text. |

**Slide background is white.** The palette above sits on white — tints and fills do
the work, not a colored canvas. No left color rail.

Keep it to these four. A palette that fits on one hand is what makes a deck look
like one deck instead of twenty slides.

---

## Typography

- **Optimist** is the typeface. It's proprietary, so it only renders on machines
  where it's licensed and installed.
- **Fallback:** Arial or Helvetica. Proportions are close enough that nothing reflows.
- **Never below 14pt.** Anywhere. Footnotes, source lines, table cells, axis labels —
  all of it. If content doesn't fit at 14pt, the slide has too much content. Split it.

That last rule is the one people fight hardest and regret ignoring. Six-point footnotes
are invisible from the third row of any conference room.

---

## The three-box pattern

The default layout for anything that describes a flow, a pipeline, or a
transformation is **three boxes across**:

```
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│   INPUTS    │ ───► │   ENGINE    │ ───► │   OUTPUTS   │
│             │      │             │      │             │
│  what goes  │      │  what does  │      │  what comes │
│     in      │      │  the work   │      │     out     │
└─────────────┘      └─────────────┘      └─────────────┘
```

Why three:

- It matches how people already narrate a system out loud — *this goes in, that
  happens, this comes out.*
- Three is the most boxes that stay legible at 14pt+ across a 13.3" slide.
- It forces a decision about what the middle actually is. Diagrams that sprawl into
  nine tiles usually do so because nobody decided.

**Variations that still count as three-box:**
- Actor → Gateway → System (an auth flow)
- Before → Change → After (a migration)
- A chain of five with the middle three carrying the weight

**Supporting detail goes below the boxes**, as a compact row of chips or a single
line of text — not crammed inside them.

---

## Structural rules

These are about the file, not the look. They matter more than the colors.

1. **Titles go in the layout's real title placeholder.** Not a text box positioned
   where a title would be. The placeholder is what outline view, accessibility
   tools, and every downstream export actually read.

2. **Text lives inside its shape.** One shape carrying both the fill *and* the text —
   not a transparent text box floating on top of a rectangle. Two stacked objects
   drift apart the moment anyone resizes anything.

3. **No floating text boxes as a layout crutch.** If something needs a position,
   it needs a shape or a placeholder.

4. **Verify, don't eyeball.** Before shipping, check programmatically: zero text runs
   under 14pt, a real title placeholder on every slide, zero stray floating text
   boxes. A script catches what a read-through won't.

---

## Quick checklist

- [ ] White background
- [ ] Only the four palette colors
- [ ] Optimist (or Arial fallback) throughout
- [ ] Nothing under 14pt
- [ ] Titles in real title placeholders
- [ ] Text inside shapes, not layered on top
- [ ] Flows drawn as three boxes
