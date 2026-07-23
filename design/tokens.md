# Design Tokens: Henry County Directory

This document defines the visual design system tokens extracted from the reference homepage design ([reference-homepage.jpg.jpg](file:///c:/Users/ZaZeZi/OneDrive/Desktop/henry-county-directory/design/reference-homepage.jpg.jpg)). Use these tokens consistently across all components and pages to avoid design drift.

---

## 1. Color Palette

Our color scheme relies on a single vibrant primary accent, clean off-white backgrounds, and a charcoal hierarchy for typography to maintain high contrast and a premium feel.

| Token | CSS Variable | Hex Code | Purpose |
| :--- | :--- | :--- | :--- |
| **Primary Accent** | `--color-accent` | `#E8505B` | Buttons, badges, active states, key icons, logo element |
| **Primary Hover** | `--color-accent-hover` | `#CF3641` | Hover state for accent-colored buttons/links |
| **Accent Muted** | `--color-accent-muted` | `#FCEBEF` | Soft pink backgrounds for active category cards, alert elements |
| **Off-White Bg** | `--color-bg-app` | `#F8F9FA` | Page-level section backgrounds |
| **Pure White** | `--color-bg-card` | `#FFFFFF` | Card backgrounds, search bar, dropdowns, testimonials |
| **Charcoal Dark** | `--color-text-dark` | `#212529` | Headings, titles, active navigation links, core labels |
| **Charcoal Medium** | `--color-text-medium` | `#495057` | Primary body text, descriptions, inactive states |
| **Charcoal Light** | `--color-text-light` | `#6C757D` | Metadata, counts, subtitles, placeholders |
| **Border Light** | `--color-border-light` | `#E9ECEF` | Subtle borders for inputs, category borders, dividers |

### Status & Badge Colors
* **Featured**: Accent Background (`#E8505B`), White Text (`#FFFFFF`)
* **Best Rate**: Orange Background (`#FF9F43`), White Text (`#FFFFFF`)
* **Most View**: Slate Background (`#485460`), White Text (`#FFFFFF`)
* **Ad**: Blue Background (`#2E86DE`), White Text (`#FFFFFF`)
* **Verified Check**: Emerald/Green (`#28C76F`)
* **Star Ratings**: Amber (`#FFB800`)
* **Open Status**: Emerald/Green Text/Indicator (`#28C76F`)
* **Closed Status**: Accent Red/Coral Text/Indicator (`#E8505B`)

---

## 2. Typography

We pair a high-character, bold sans-serif headline font with a highly legible, clean sans-serif body font.

* **Headline Font Stack**: `Outfit`, `Inter`, system-ui, sans-serif (Font weight `700` or `800` for strong hierarchy)
* **Body Font Stack**: `Inter`, system-ui, sans-serif (Font weight `300` for light-weight descriptions, `400` for standard, `500` for medium/semi-bold labels)

### Typographic Scale & Pairings

```
Hero Title:       5xl (48px) / 6xl (60px)   -> font-extrabold, tracking-tight, text-dark
Hero Subtitle:    lg (18px) / xl (20px)      -> font-light, text-light
Section Heading:  3xl (30px) / 4xl (36px)   -> font-bold, tracking-tight, text-dark
Section Sub:      base (16px)                -> font-light, text-light
Card Title:       lg (18px)                  -> font-bold, text-dark
Body / Metadata:  sm (14px) / xs (12px)      -> font-normal/light, text-medium/light
```

---

## 3. Spacing & Border Radius

Consistency in spacing and rounded corners defines the premium card-based layout.

* **Border Radius**:
  * **Base Container**: `rounded-2xl` (`16px`)
  * **Card Corner**: `rounded-xl` (`12px`)
  * **Button / Input Corner**: `rounded-lg` (`8px`)
  * **Search Bar / Badges**: `rounded-full` (`9999px` / pill-shaped)
* **Shadows**:
  * **Card / Testimonial Shadow**: Custom smooth shadow `shadow-card`
    * Tailwind value: `0 10px 30px -5px rgba(0, 0, 0, 0.05), 0 2px 10px -2px rgba(0, 0, 0, 0.02)`
  * **Hover Elevation**: Elevate from standard shadow to active state with translate.
* **Animations**:
  * Transition property: `all`
  * Transition duration: `300ms`
  * Transition timing function: `cubic-bezier(0.4, 0, 0.2, 1)` (ease-in-out)

---

## 4. Reference Component Guidelines

### Search Bar (Hero)
* **Shape**: Full-pill configuration (`rounded-full`) containing multiple input sections.
* **Layout**: Segmented into "What" and "Where" input fields separated by thin divider lines (`border-border-light`), ending with a solid red search button (`bg-accent` with a search icon + text, `rounded-full`).
* **Shadow**: Pronounced soft floating shadow (`shadow-lg`).

### Category Browser (Icon Grid)
* **Structure**: Grid of individual square cards.
* **Inactive State**: White background (`bg-card`), thin border (`border-border-light`), grey icon and text.
* **Active State / Hover State**: Transition to solid red accent background (`bg-accent`), white icon and text, with a subtle upward movement (`-translate-y-1`).

### Directory Listings (Cards)
* **Layout**: Image at the top with a aspect ratio of `4:3` or `16:9`. Top-left overlay badge (Featured, Best Rate, etc.) and top-right outline heart/save icon.
* **Body**: Profile/avatar overlap on card divider, bold heading, small category and price metadata, star rating indicators, truncate description, and location metadata in the footer.
