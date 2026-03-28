# Design System: Geometric Vitality

## 1. Overview & Creative North Star
The Creative North Star for this design system is **"The Precision Guardian."** In a medical emergency context, the UI must act as a calm, authoritative presence. We move beyond generic healthcare templates by embracing an editorial layout—utilizing intentional asymmetry, generous white space, and a sophisticated layering system that communicates urgency without inducing panic.

The system breaks the "standard grid" through **Geometric Vitality**: using bold, oversized typography paired with soft, nested containers. We avoid the "boxed-in" feel of traditional apps by allowing elements to breathe and using background shifts rather than harsh lines to define the information architecture.

---

## 2. Colors
Our palette is rooted in a high-trust digital blue, supported by a nuanced spectrum of surface tones that define hierarchy through temperature rather than just darkness.

### Core Palette
- **Primary (`#0058be`):** The "Action Blue." Used for high-priority CTAs and brand presence.
- **Surface (`#f9f9ff`):** A cool-tinted white that reduces eye strain in clinical environments.
- **On-Surface (`#191b23`):** High-contrast ink for maximum legibility.
- **Status Tones:**
- **Critical:** `error` (#ba1a1a)
- **Serious:** `tertiary` (#924700)
- **Stable:** `on_secondary_container` (#405682) variant with green accents.

### The "No-Line" Rule
**Explicit Instruction:** Designers are prohibited from using 1px solid borders for sectioning or grouping content. Boundaries must be defined solely through background color shifts.
- To separate a section, place a `surface_container_low` section atop the `background`.
- To highlight a card, use `surface_container_lowest` (Pure White) against a `surface_container` background.

### Signature Textures & Glass
To provide "soul," utilize a subtle linear gradient on primary elements, transitioning from `primary` (#0058be) to `primary_container` (#2170e4). For floating navigation or emergency overlays, use **Glassmorphism**:
- **Fill:** `surface_container_lowest` at 80% opacity.
- **Effect:** Backdrop Blur (20px-30px).

---

## 3. Typography
We use **Plus Jakarta Sans** for its geometric clarity and modern professional tone.

- **Display (Lg/Md):** Used for primary landing states (e.g., "Hello, Dr. Aris"). It should feel editorial—tight tracking (-2%) and bold weights.
- **Headline (Sm/Md):** Used for section headers. These provide the "at-a-glance" context for busy clinicians.
- **Title (Md/Sm):** Used within cards to identify patient names or critical data points.
- **Body (Md):** Optimized for 1.5x line height to ensure readability of medical notes.
- **Label (Sm):** All-caps for metadata (e.g., "SYSTEM STATUS"), using `outline` (#727785) color to stay secondary to content.

---

## 4. Elevation & Depth
Depth is achieved through **Tonal Layering**, mimicking the physical stacking of medical charts and glass slides.

- **The Layering Principle:**
- Level 0: `background` (#f9f9ff)
- Level 1: `surface_container_low` (General sections)
- Level 2: `surface_container_lowest` (Interactive cards/inputs)
- **Ambient Shadows:** Standard shadows are replaced by "Light Air" shadows. Use the `on_surface` color at 4% opacity with a 32px blur and 8px Y-offset. This creates a soft lift that feels integrated into the environment.
- **The "Ghost Border" Fallback:** If a boundary is required for accessibility, use the `outline_variant` token at **15% opacity**. Never use 100% opaque borders.

---

## 5. Components

### Buttons
- **Primary:** High-fill `primary` with `on_primary` text. Radius: `md` (0.75rem).
- **Secondary:** `surface_container_highest` background with `primary` text. No border.
- **Emergency CTA:** Oversized padding (24px horizontal) with a leading icon to signify immediate action.

### Cards & Lists
- **Rule:** Forbid the use of divider lines.
- Use the **Spacing Scale** (specifically `spacing.6` or `1.5rem`) to create a clear gutter between items.
- For lists, use a subtle `surface_hover` state that shifts the background tone slightly when interacted with.

### Input Fields
- **Stateful Geometry:** Use `surface_container_lowest` for the fill.
- **Focus:** Instead of a simple color change, apply a 2px `primary` "Ghost Border" at 40% opacity and a subtle ambient shadow to make the field "pop" toward the user.

### Status Chips
- **Critical/Serious:** Use high-saturation backgrounds with white text.
- **Selection Chips:** Use `secondary_container` with `on_secondary_container` text. Use `rounded.full` for these elements to distinguish them from the `rounded.md` primary cards.

---

## 6. Do's and Don'ts

### Do
- **Do** use asymmetrical layouts. A large headline on the left with a floating action card on the right creates a premium, custom feel.
- **Do** prioritize the "Emergency-First" hierarchy. The most critical patient data should always sit on the highest tonal layer (`surface_container_lowest`).
- **Do** use the spacing scale religiously to maintain a rhythmic, breathable layout.

### Don't
- **Don't** use black (#000000). Always use `on_surface` (#191b23) for text to maintain the "Precision Guardian" aesthetic.
- **Don't** use standard "Drop Shadows." They feel dated and "out-of-the-box." Stick to ambient tonal shifts.
- **Don't** use generic iconography. Use clean, geometric icons with a consistent 2px stroke weight that matches the `outline` token.