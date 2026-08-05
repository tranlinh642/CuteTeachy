---
name: Serene Educator
colors:
  surface: '#fff8f7'
  surface-dim: '#e3d7d7'
  surface-bright: '#fff8f7'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#fdf1f1'
  surface-container: '#f7ebeb'
  surface-container-high: '#f1e5e5'
  surface-container-highest: '#ebe0e0'
  on-surface: '#201a1a'
  on-surface-variant: '#4f4448'
  inverse-surface: '#352f2f'
  inverse-on-surface: '#faeeee'
  outline: '#817478'
  outline-variant: '#d2c3c7'
  surface-tint: '#795465'
  primary: '#795465'
  on-primary: '#ffffff'
  primary-container: '#f8c8dc'
  on-primary-container: '#765162'
  inverse-primary: '#e9bacd'
  secondary: '#496271'
  on-secondary: '#ffffff'
  secondary-container: '#cce6f9'
  on-secondary-container: '#4f6877'
  tertiary: '#5e604d'
  on-tertiary: '#ffffff'
  tertiary-container: '#d7d7bf'
  on-tertiary-container: '#5c5d4a'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffd8e7'
  primary-fixed-dim: '#e9bacd'
  on-primary-fixed: '#2e1221'
  on-primary-fixed-variant: '#5f3c4d'
  secondary-fixed: '#cce6f9'
  secondary-fixed-dim: '#b0cadc'
  on-secondary-fixed: '#021e2b'
  on-secondary-fixed-variant: '#314a59'
  tertiary-fixed: '#e4e4cc'
  tertiary-fixed-dim: '#c8c8b0'
  on-tertiary-fixed: '#1b1d0e'
  on-tertiary-fixed-variant: '#474836'
  background: '#fff8f7'
  on-background: '#201a1a'
  surface-variant: '#ebe0e0'
typography:
  display-lg:
    fontFamily: Quicksand
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Quicksand
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Quicksand
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  title-lg:
    fontFamily: Quicksand
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Quicksand
    fontSize: 16px
    fontWeight: '500'
    lineHeight: 24px
  body-sm:
    fontFamily: Quicksand
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
  label-md:
    fontFamily: Quicksand
    fontSize: 12px
    fontWeight: '700'
    lineHeight: 16px
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  unit-1: 4px
  unit-2: 8px
  unit-4: 16px
  unit-6: 24px
  unit-8: 32px
  container-padding: 20px
  gutter: 16px
---

## Brand & Style

The design system is centered on a "Gentle Productivity" philosophy, specifically tailored for educators who balance high-energy classrooms with the need for personal organization. The brand personality is organized, gentle, and encouraging, moving away from the high-stress "hustle culture" of typical time management apps.

The aesthetic leans heavily into **Soft Minimalism**. It utilizes generous whitespace, a restricted pastel palette, and soft-focus depth to create a "digital sanctuary." The goal is to reduce cognitive load and evoke an emotional response of calm and quiet confidence. Every interaction should feel like a supportive nudge rather than a rigid demand.

## Colors

The palette is composed of low-saturation, high-brightness pastels that ensure the UI remains airy and light.

- **Primary (Soft Pink):** Used for primary actions, progress indicators, and active states. It represents warmth and encouragement.
- **Secondary (Baby Blue):** Used for secondary categories, calendar events, and informational chips. It evokes calm and focus.
- **Tertiary (Warm Beige):** Used for subtle background layering and container surfaces to add organic warmth.
- **Neutral (Muted Cocoa):** Instead of pure black or grey, a soft, warm brown is used for typography to maintain a gentle contrast ratio that is easy on the eyes during long planning sessions.

## Typography

This design system uses **Quicksand** exclusively to maintain a cohesive, friendly, and approachable atmosphere. The rounded terminals of the typeface mirror the "rounded-2xl" shape language of the UI components.

- **Headlines:** Use SemiBold or Bold weights with slightly tighter letter spacing to create a friendly sense of authority.
- **Body Text:** Set in Medium weight rather than Regular to ensure legibility against pastel backgrounds and to emphasize the "soft" nature of the strokes.
- **Labels:** Uppercase is used sparingly for small labels (like category tags) to provide clear hierarchy without feeling aggressive.

## Layout & Spacing

The layout follows a **Fluid Grid** model optimized for mobile-first interaction. 

- **Soft Margins:** Use a 20px side margin for the main content containers to provide "breathing room" on small screens.
- **Vertical Rhythm:** A strict 4px/8px baseline grid ensures consistent vertical alignment. Elements should generally be separated by 16px (unit-4) or 24px (unit-6) to prevent the UI from feeling cluttered.
- **Touch Targets:** Minimum touch target size is 48x48px, following the friendly, accessible nature of the brand.

## Elevation & Depth

To maintain a calm and minimalist aesthetic, this design system avoids heavy shadows and high-contrast outlines.

- **Tonal Layering:** Depth is primarily created by placing `primary` or `secondary` pastel containers on a `background-color` or `tertiary-color` (Warm Beige) surface.
- **Subtle Shadows:** Use "Ambient Shadows" for interactive cards. Shadows should be low-opacity (8-12%) and use a tint of the neutral color (Cocoa) rather than pure black to keep the appearance soft.
- **Glassmorphism:** Use light background blurs (10px - 20px) on top navigation bars or floating action buttons to maintain a sense of context and vertical stack without creating harsh visual breaks.

## Shapes

The shape language is defined by **Extreme Roundness**. Every corner is treated with a significant radius to remove "sharpness" from the user experience, reinforcing the gentle and safe personality.

- **Cards & Buttons:** Use `rounded-2xl` (1rem / 16px) as the standard.
- **Inputs:** Use `rounded-xl` (0.75rem / 12px) to provide a distinct but related shape for interactive form elements.
- **Selection Indicators:** Use pill shapes (full rounding) for tags, chips, and toggles.

## Components

### Buttons
- **Primary:** Soft Pink background, Neutral text. 16px padding (top/bottom), 24px (sides).
- **Secondary:** Transparent with a 1.5px Baby Blue border or solid Warm Beige background.
- **Text:** Always Quicksand Bold.

### Cards
- White or Warm Beige background.
- Subtle `shadow-sm` on rest, `shadow-md` on hover/active.
- No borders; use color shifts to define boundaries.

### Input Fields
- Soft Warm Beige background.
- Floating labels using `label-md` typography.
- Active state indicated by a 2px Baby Blue bottom border or soft glow.

### Chips & Tags
- Pill-shaped.
- Use Secondary (Baby Blue) for organization tags and Primary (Pink) for urgent or high-priority tasks.

### Lists
- Separated by whitespace or very light 1px dividers in a faint beige.
- List items should have generous vertical padding (16px) to maintain the airy feel.

### Specialized Components
- **Progress Petals:** A custom progress indicator that uses "blooming" petal shapes instead of standard progress bars to provide encouraging visual feedback.
- **Daily Reflection Card:** A dedicated card style with a very soft gradient background to signal a change in pace for end-of-day mindfulness.