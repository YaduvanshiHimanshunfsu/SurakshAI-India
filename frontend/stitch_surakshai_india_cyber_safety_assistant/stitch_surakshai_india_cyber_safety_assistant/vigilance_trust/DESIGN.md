---
name: Vigilance & Trust
colors:
  surface: '#f7f9fb'
  surface-dim: '#d8dadc'
  surface-bright: '#f7f9fb'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f4f6'
  surface-container: '#eceef0'
  surface-container-high: '#e6e8ea'
  surface-container-highest: '#e0e3e5'
  on-surface: '#191c1e'
  on-surface-variant: '#45464d'
  inverse-surface: '#2d3133'
  inverse-on-surface: '#eff1f3'
  outline: '#76777d'
  outline-variant: '#c6c6cd'
  surface-tint: '#565e74'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#131b2e'
  on-primary-container: '#7c839b'
  inverse-primary: '#bec6e0'
  secondary: '#0051d5'
  on-secondary: '#ffffff'
  secondary-container: '#316bf3'
  on-secondary-container: '#fefcff'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#002114'
  on-tertiary-container: '#069669'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dae2fd'
  primary-fixed-dim: '#bec6e0'
  on-primary-fixed: '#131b2e'
  on-primary-fixed-variant: '#3f465c'
  secondary-fixed: '#dbe1ff'
  secondary-fixed-dim: '#b4c5ff'
  on-secondary-fixed: '#00174b'
  on-secondary-fixed-variant: '#003ea8'
  tertiary-fixed: '#85f8c4'
  tertiary-fixed-dim: '#68dba9'
  on-tertiary-fixed: '#002114'
  on-tertiary-fixed-variant: '#005137'
  background: '#f7f9fb'
  on-background: '#191c1e'
  surface-variant: '#e0e3e5'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-sm:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
    letterSpacing: 0.01em
  hindi-body:
    fontFamily: Noto Sans Devanagari
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 30px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  2xl: 48px
  3xl: 64px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: auto
  max-width: 1280px
---

## Brand & Style
The design system is engineered for a premium cybersecurity platform tailored for the Indian market. It prioritizes a sense of calm, credibility, and proactive safety, moving away from the typical "hacker" aesthetic toward a modern, professional, and accessible institutional look.

The style is **Corporate Modern with Tactile Softness**. It utilizes a clean, light-mode-first interface that leverages generous whitespace to reduce cognitive load during high-stress security events. The visual language avoids alarmism, instead using high-quality typography and structured layouts to convey authority and reliability.

**Key visual drivers:**
- **Clarity:** Uncluttered interfaces that highlight critical information first.
- **Stability:** Solid, grounded colors and balanced layouts.
- **Accessibility:** Bilingual support and high-contrast elements for diverse user groups.

## Colors
The palette is rooted in "Security Blues" to establish immediate trust. 

- **Primary Navy (#0F172A):** Used for core branding, headers, and high-level navigation to provide a professional anchor.
- **Trust Blue (#2563EB):** The main action color, used for primary buttons, links, and active states.
- **Safe Green (#059669):** Communicates "Protected" or "Resolved" status without being neon or jarring.
- **Semantic Colors:** Scam Red and Caution Amber are used sparingly for alerts. Their saturation is adjusted to feel serious but not panicked.
- **Background (#F8FAFC):** A very light cool slate that reduces eye strain compared to pure white while maintaining a clean, medical-grade feel.

## Typography
This design system uses a dual-font strategy to ensure seamless bilingual experiences.

- **English (Inter):** A highly legible, systematic sans-serif that excels in data-heavy environments. It provides a technical but approachable character.
- **Hindi (Noto Sans Devanagari):** Selected for its exceptional legibility and compatibility with Inter’s x-height. 

**Implementation Notes:**
- Hindi text requires roughly 15-20% more line-height than English to accommodate conjunct characters and vowel signs without clipping.
- Use `Font-Weight: 600` for emphasis in both languages to maintain visual hierarchy.
- For bilingual labels (English + Hindi), the English text should typically precede the Hindi text or be stacked with the primary language on top.

## Layout & Spacing
The layout follows a **Fixed-Grid** approach for desktop and a **Fluid-Grid** for mobile. 

- **Desktop:** 12-column grid with a 24px gutter. Content is centered with a max-width of 1280px to maintain readability.
- **Mobile:** 4-column fluid grid with 16px side margins. 
- **Spacing Rhythm:** Based on a 4px baseline. Most common containers use `24px (lg)` or `32px (xl)` padding to create a sense of "premium breathing room," preventing the interface from feeling cramped or urgent.

## Elevation & Depth
Depth is created through **Tonal Layering and Soft Shadows**. This avoids the harshness of high-contrast borders and provides a modern, tactile feel.

- **Level 0 (Background):** #F8FAFC. The lowest layer.
- **Level 1 (Cards/Surfaces):** Pure #FFFFFF. These use a very soft, diffused shadow (Blur: 15px, Opacity: 4%, Color: #0F172A) to appear slightly lifted.
- **Level 2 (Interactive):** When hovered, cards or buttons increase their shadow spread slightly (Blur: 25px, Opacity: 8%) to provide tactile feedback.
- **Outlines:** Use a subtle 1px border (#E2E8F0) on cards to ensure definition on all screen types, even when shadows are subtle.

## Shapes
The design system employs **Rounded (0.5rem)** geometry to soften the technical nature of cybersecurity. 

- **Standard Elements:** Buttons, input fields, and small components use a `0.5rem (8px)` radius.
- **Large Containers:** Content cards and feature blocks use `rounded-lg (1rem / 16px)` to create a friendly, modern containerized look.
- **Special Elements:** Segmented controls and search bars may use `rounded-xl` for a more "pill-like" organic feel.

## Components

### Buttons
- **Primary:** Trust Blue background, White text. Bold, 16px height-padding.
- **Secondary:** Transparent background, Navy border (1px), Navy text.
- **Accessible Focus:** 2px offset ring in Trust Blue for keyboard navigation.

### Segmented Controls (Language Switcher)
- A "pill" shaped container with a soft grey background. The active state is a white "floating" card with a subtle shadow that slides between 'English' and 'हिन्दी'.

### Alert Banners
- **Style:** Full-width or inline, but never covering core content. 
- **Scam Alert:** Light Red tint background with Scam Red left-border (4px) and a Lucide `ShieldAlert` icon.
- **Success:** Light Green tint with Safe Green border and Lucide `ShieldCheck`.

### Interactive Cards
- Used for "Risk Assessments" or "Feature Links."
- Include a Lucide icon in a circular soft-colored housing in the top right.
- On hover, the 1px border shifts from Grey to Trust Blue.

### Icons
- Use **Lucide Icons** with a `2px` stroke width. 
- Icons should be consistently sized (20px for UI controls, 32px for feature highlights).