# SCSS Global System - Implementation Template

Dit document bevat alle SCSS-bestanden die u direct kunt gebruiken.

---

## 📁 Bestandsstructuur

```
src/styles/
├── _variables.scss       # CSS custom properties (root variabelen)
├── _typography.scss      # Font-sizes, font-weights
├── _spacing.scss         # Margin, padding, gap utilities
├── _transitions.scss     # Animations, transitions, mixins
├── _mixins.scss          # Herbruikbare SCSS-mixins
├── _borders.scss         # Border-radius, border-styles
├── _utilities.scss       # Utility-klassen (flex, grid, etc)
├── index.scss            # Import centraal
└── README.md             # Lokale documentatie
```

---

## 📄 FILE 1: `_variables.scss`

```scss
// src/styles/_variables.scss
// Global CSS Custom Properties

:root {
  // ═══════════════════════════════════════════════════════════
  // COLORS - Primary Brand
  // ═══════════════════════════════════════════════════════════
  --color-primary: #5aaab4;
  --color-primary-dark: #4a8f98;
  --color-primary-light: #8cc8d2;
  
  // Alpha variations (RGBA)
  --color-primary-alpha-08: rgba(90, 170, 180, 0.08);
  --color-primary-alpha-10: rgba(90, 170, 180, 0.1);
  --color-primary-alpha-12: rgba(90, 170, 180, 0.12);
  --color-primary-alpha-15: rgba(90, 170, 180, 0.15);
  --color-primary-alpha-25: rgba(90, 170, 180, 0.25);
  --color-primary-alpha-30: rgba(90, 170, 180, 0.3);
  --color-primary-alpha-45: rgba(90, 170, 180, 0.45);

  // ═══════════════════════════════════════════════════════════
  // COLORS - Status
  // ═══════════════════════════════════════════════════════════
  --color-success: #538d4e;
  --color-danger: #ef4444;
  --color-danger-dark: #dc2626;
  --color-warning: #f59e0b;

  // ═══════════════════════════════════════════════════════════
  // COLORS - Text
  // ═══════════════════════════════════════════════════════════
  --color-text-dark: oklch(0.25 0.02 264);        // Headings
  --color-text-primary: oklch(0.3 0.02 264);      // Body text
  --color-text-secondary: oklch(0.55 0.02 264);   // Secondary
  --color-text-muted: oklch(0.5 0.02 264);        // Muted/subtle
  --color-text-light: oklch(0.6 0.02 264);        // Light text
  --color-text-white: #fff;

  // ═══════════════════════════════════════════════════════════
  // COLORS - Semantic
  // ═══════════════════════════════════════════════════════════
  --color-background: oklch(0.90 0.012 90);
  --color-background-hex: #e1dcc3;
  --color-card: oklch(0.95 0.005 90);
  --color-border: 1px solid #e5e7eb;
  --color-white: #fff;
  --color-white-full: #ffffff;

  // ═══════════════════════════════════════════════════════════
  // SPACING - Geometric Scale (4px base)
  // ═══════════════════════════════════════════════════════════
  --spacing-0: 0;
  --spacing-xs: 0.25rem;   /* 4px */
  --spacing-sm: 0.5rem;    /* 8px */
  --spacing-md: 0.75rem;   /* 12px */
  --spacing-lg: 1rem;      /* 16px */
  --spacing-xl: 1.5rem;    /* 24px */
  --spacing-2xl: 2rem;     /* 32px */
  --spacing-3xl: 2.5rem;   /* 40px */
  --spacing-4xl: 3rem;     /* 48px */

  // ═══════════════════════════════════════════════════════════
  // BORDER RADIUS - Predefined Scale
  // ═══════════════════════════════════════════════════════════
  --radius-sm: 8px;
  --radius-md: 10px;
  --radius-lg: 12px;
  --radius-xl: 16px;
  --radius-2xl: 20px;
  --radius-full: 50%;
  --radius-circle: 999px;

  // ═══════════════════════════════════════════════════════════
  // TYPOGRAPHY - Font Sizes (clamp-based responsive)
  // ═══════════════════════════════════════════════════════════
  --font-size-xs: 0.72rem;      /* 11.52px */
  --font-size-sm: 0.82rem;      /* 13.12px */
  --font-size-base: 0.95rem;    /* 15.2px */
  --font-size-lg: 1.1rem;       /* 17.6px */
  --font-size-xl: 1.4rem;       /* 22.4px */
  --font-size-2xl: 1.6rem;      /* 25.6px */

  // Responsive clamp (comment: adjust viewport values as needed)
  --font-size-heading-lg: clamp(1.8rem, 3vw, 2.6rem);
  --font-size-heading-xl: clamp(2rem, 5vw, 2.8rem);

  // ═══════════════════════════════════════════════════════════
  // TYPOGRAPHY - Font Weights
  // ═══════════════════════════════════════════════════════════
  --font-weight-normal: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;
  --font-weight-bold: 700;
  --font-weight-extrabold: 800;

  // ═══════════════════════════════════════════════════════════
  // TRANSITIONS & ANIMATIONS - Timings
  // ═══════════════════════════════════════════════════════════
  --transition-fast: 0.1s;      /* Transform, filter */
  --transition-base: 0.15s;     /* Background, color */
  --transition-slow: 0.2s;      /* Complex changes */
  --ease-in-out: ease-in-out;
  --ease-out: ease-out;
  --ease-in: ease-in;

  // ═══════════════════════════════════════════════════════════
  // SHADOWS
  // ═══════════════════════════════════════════════════════════
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1);

  // ═══════════════════════════════════════════════════════════
  // Z-INDEX - Stacking Context
  // ═══════════════════════════════════════════════════════════
  --z-overlay: 50;
  --z-modal: 55;
  --z-dropdown: 60;
  --z-tooltip: 70;
}
```

---

## 📄 FILE 2: `_typography.scss`

```scss
// src/styles/_typography.scss
// Typography Utilities

// ═══════════════════════════════════════════════════════════
// Font Size Utilities
// ═══════════════════════════════════════════════════════════

.text-xs {
  font-size: var(--font-size-xs);
}

.text-sm {
  font-size: var(--font-size-sm);
}

.text-base {
  font-size: var(--font-size-base);
}

.text-lg {
  font-size: var(--font-size-lg);
}

.text-xl {
  font-size: var(--font-size-xl);
}

.text-2xl {
  font-size: var(--font-size-2xl);
}

// ═══════════════════════════════════════════════════════════
// Font Weight Utilities
// ═══════════════════════════════════════════════════════════

.font-normal {
  font-weight: var(--font-weight-normal);
}

.font-medium {
  font-weight: var(--font-weight-medium);
}

.font-semibold {
  font-weight: var(--font-weight-semibold);
}

.font-bold {
  font-weight: var(--font-weight-bold);
}

.font-extrabold {
  font-weight: var(--font-weight-extrabold);
}

// ═══════════════════════════════════════════════════════════
// Text Color Utilities
// ═══════════════════════════════════════════════════════════

.text-primary {
  color: var(--color-text-primary);
}

.text-secondary {
  color: var(--color-text-secondary);
}

.text-muted {
  color: var(--color-text-muted);
}

.text-light {
  color: var(--color-text-light);
}

.text-white {
  color: var(--color-text-white);
}

// ═══════════════════════════════════════════════════════════
// Text Transform Utilities
// ═══════════════════════════════════════════════════════════

.uppercase {
  text-transform: uppercase;
}

.capitalize {
  text-transform: capitalize;
}

.lowercase {
  text-transform: lowercase;
}

// ═══════════════════════════════════════════════════════════
// Line Height
// ═══════════════════════════════════════════════════════════

.leading-tight {
  line-height: 1.1;
}

.leading-normal {
  line-height: 1.5;
}

.leading-relaxed {
  line-height: 1.75;
}
```

---

## 📄 FILE 3: `_spacing.scss`

```scss
// src/styles/_spacing.scss
// Spacing Utilities (margin, padding, gap)

// ═══════════════════════════════════════════════════════════
// Margin Utilities
// ═══════════════════════════════════════════════════════════

.m-0 { margin: 0; }
.m-xs { margin: var(--spacing-xs); }
.m-sm { margin: var(--spacing-sm); }
.m-md { margin: var(--spacing-md); }
.m-lg { margin: var(--spacing-lg); }
.m-xl { margin: var(--spacing-xl); }
.m-2xl { margin: var(--spacing-2xl); }

// Margin directional
.mt-xs { margin-top: var(--spacing-xs); }
.mt-sm { margin-top: var(--spacing-sm); }
.mt-md { margin-top: var(--spacing-md); }
.mt-lg { margin-top: var(--spacing-lg); }
.mt-xl { margin-top: var(--spacing-xl); }

.mb-xs { margin-bottom: var(--spacing-xs); }
.mb-sm { margin-bottom: var(--spacing-sm); }
.mb-md { margin-bottom: var(--spacing-md); }
.mb-lg { margin-bottom: var(--spacing-lg); }
.mb-xl { margin-bottom: var(--spacing-xl); }
.mb-2xl { margin-bottom: var(--spacing-2xl); }

// ═══════════════════════════════════════════════════════════
// Padding Utilities
// ═══════════════════════════════════════════════════════════

.p-xs { padding: var(--spacing-xs); }
.p-sm { padding: var(--spacing-sm); }
.p-md { padding: var(--spacing-md); }
.p-lg { padding: var(--spacing-lg); }
.p-xl { padding: var(--spacing-xl); }

// ═══════════════════════════════════════════════════════════
// Gap Utilities (for flex/grid)
// ═══════════════════════════════════════════════════════════

.gap-0 { gap: 0; }
.gap-xs { gap: var(--spacing-xs); }
.gap-sm { gap: var(--spacing-sm); }
.gap-md { gap: var(--spacing-md); }
.gap-lg { gap: var(--spacing-lg); }
.gap-xl { gap: var(--spacing-xl); }
.gap-2xl { gap: var(--spacing-2xl); }

// ═══════════════════════════════════════════════════════════
// Width/Height Utilities
// ═══════════════════════════════════════════════════════════

.w-full { width: 100%; }
.w-auto { width: auto; }
.h-full { height: 100%; }
.h-auto { height: auto; }
.h-screen { height: 100vh; }
```

---

## 📄 FILE 4: `_transitions.scss`

```scss
// src/styles/_transitions.scss
// Transition & Animation Mixins

// ═══════════════════════════════════════════════════════════
// Transition Mixins
// ═══════════════════════════════════════════════════════════

@mixin transition-all {
  transition: all var(--transition-base) var(--ease-in-out);
}

@mixin transition-colors {
  transition:
    background-color var(--transition-base),
    color var(--transition-base),
    border-color var(--transition-base);
}

@mixin transition-transform {
  transition:
    transform var(--transition-fast),
    filter var(--transition-base);
}

@mixin transition-shadow {
  transition: box-shadow var(--transition-base);
}

// ═══════════════════════════════════════════════════════════
// Transition Utility Classes
// ═══════════════════════════════════════════════════════════

.transition-all {
  @include transition-all;
}

.transition-colors {
  @include transition-colors;
}

.transition-transform {
  @include transition-transform;
}

.transition-shadow {
  @include transition-shadow;
}

// ═══════════════════════════════════════════════════════════
// State Mixins
// ═══════════════════════════════════════════════════════════

@mixin hover-brightness {
  &:hover:not(:disabled) {
    filter: brightness(1.06);
  }
}

@mixin hover-opacity {
  &:hover:not(:disabled) {
    opacity: 0.8;
  }
}

@mixin active-transform {
  &:active:not(:disabled) {
    transform: translateY(2px);
  }
}

@mixin disabled-state {
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

// ═══════════════════════════════════════════════════════════
// Animation Definitions
// ═══════════════════════════════════════════════════════════

@keyframes slideIn {
  from {
    transform: translateX(100%);
  }
  to {
    transform: translateX(0);
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes scaleIn {
  from {
    transform: scale(0.95);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

// Utility classes for animations
.animate-slide-in {
  animation: slideIn 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.animate-fade-in {
  animation: fadeIn 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.animate-scale-in {
  animation: scaleIn 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
```

---

## 📄 FILE 5: `_mixins.scss`

```scss
// src/styles/_mixins.scss
// Reusable SCSS Mixins

// ═══════════════════════════════════════════════════════════
// Flex Layout Mixins
// ═══════════════════════════════════════════════════════════

@mixin flex-center {
  display: flex;
  align-items: center;
  justify-content: center;
}

@mixin flex-between {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

@mixin flex-column-center {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

@mixin flex-column {
  display: flex;
  flex-direction: column;
}

@mixin flex-row {
  display: flex;
  flex-direction: row;
}

// ═══════════════════════════════════════════════════════════
// Button Mixins
// ═══════════════════════════════════════════════════════════

@mixin button-base {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-md) var(--spacing-lg);
  border: none;
  border-radius: var(--radius-lg);
  font-family: inherit;
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-bold);
  cursor: pointer;
  white-space: nowrap;
  user-select: none;
  @include transition-all;
}

@mixin button-primary {
  @include button-base;
  background: var(--color-primary);
  color: var(--color-text-white);

  &:hover:not(:disabled) {
    filter: brightness(1.06);
    transform: translateY(-1px);
  }

  &:active:not(:disabled) {
    transform: translateY(1px);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

@mixin button-secondary {
  @include button-base;
  background: transparent;
  color: var(--color-primary);
  border: 1.5px solid var(--color-primary-alpha-25);

  &:hover:not(:disabled) {
    background: var(--color-primary-alpha-08);
    border-color: var(--color-primary);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

@mixin button-danger {
  @include button-base;
  background: var(--color-danger);
  color: var(--color-text-white);

  &:hover:not(:disabled) {
    filter: brightness(0.95);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

// ═══════════════════════════════════════════════════════════
// Input Mixins
// ═══════════════════════════════════════════════════════════

@mixin input-base {
  width: 100%;
  padding: var(--spacing-md) var(--spacing-lg);
  background: var(--color-background);
  border: 1.5px solid var(--color-primary-alpha-15);
  border-radius: var(--radius-lg);
  font-size: var(--font-size-base);
  font-family: inherit;
  color: var(--color-text-primary);
  @include transition-colors;

  &::placeholder {
    color: var(--color-text-muted);
  }

  &:focus {
    outline: none;
    border-color: var(--color-primary);
    background: var(--color-card);
  }

  &:disabled {
    background: var(--color-primary-alpha-08);
    color: var(--color-text-muted);
    cursor: not-allowed;
  }
}

// ═══════════════════════════════════════════════════════════
// Card/Container Mixins
// ═══════════════════════════════════════════════════════════

@mixin card-base {
  background: var(--color-card);
  border: 1.5px solid var(--color-primary-alpha-12);
  border-radius: var(--radius-xl);
  padding: var(--spacing-lg);
  @include transition-all;
}

@mixin card-hover {
  @include card-base;
  
  &:hover {
    border-color: var(--color-primary-alpha-25);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  }
}

// ═══════════════════════════════════════════════════════════
// Text/Content Mixins
// ═══════════════════════════════════════════════════════════

@mixin truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@mixin line-clamp($lines: 2) {
  display: -webkit-box;
  -webkit-line-clamp: $lines;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

@mixin visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}

// ═══════════════════════════════════════════════════════════
// Focus State Mixin
// ═══════════════════════════════════════════════════════════

@mixin focus-ring {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}
```

---

## 📄 FILE 6: `_borders.scss`

```scss
// src/styles/_borders.scss
// Border Radius & Border Utilities

// ═══════════════════════════════════════════════════════════
// Border Radius Utilities
// ═══════════════════════════════════════════════════════════

.rounded-sm {
  border-radius: var(--radius-sm);
}

.rounded-md {
  border-radius: var(--radius-md);
}

.rounded-lg {
  border-radius: var(--radius-lg);
}

.rounded-xl {
  border-radius: var(--radius-xl);
}

.rounded-2xl {
  border-radius: var(--radius-2xl);
}

.rounded-full {
  border-radius: var(--radius-full);
}

.rounded-circle {
  border-radius: var(--radius-circle);
}

// ═══════════════════════════════════════════════════════════
// Border Utilities
// ═══════════════════════════════════════════════════════════

.border-base {
  border: 1.5px solid var(--color-primary-alpha-12);
}

.border-primary {
  border: 1.5px solid var(--color-primary);
}

.border-danger {
  border: 1.5px solid var(--color-danger);
}

.border-success {
  border: 1.5px solid var(--color-success);
}

// Directional borders
.border-t {
  border-top: 1.5px solid var(--color-primary-alpha-12);
}

.border-b {
  border-bottom: 1.5px solid var(--color-primary-alpha-12);
}

.border-l {
  border-left: 1.5px solid var(--color-primary-alpha-12);
}

.border-r {
  border-right: 1.5px solid var(--color-primary-alpha-12);
}

// ═══════════════════════════════════════════════════════════
// Overflow Utilities
// ═══════════════════════════════════════════════════════════

.overflow-hidden {
  overflow: hidden;
}

.overflow-auto {
  overflow: auto;
}

.overflow-x-auto {
  overflow-x: auto;
}

.overflow-y-auto {
  overflow-y: auto;
}
```

---

## 📄 FILE 7: `_utilities.scss`

```scss
// src/styles/_utilities.scss
// General Utility Classes

// Import dependencies (if not already imported in index.scss)
@import 'transitions';
@import 'mixins';

// ═══════════════════════════════════════════════════════════
// Display Utilities
// ═══════════════════════════════════════════════════════════

.block { display: block; }
.inline { display: inline; }
.inline-block { display: inline-block; }
.flex { display: flex; }
.inline-flex { display: inline-flex; }
.grid { display: grid; }
.hidden { display: none; }

// ═══════════════════════════════════════════════════════════
// Flex Direction
// ═══════════════════════════════════════════════════════════

.flex-row { flex-direction: row; }
.flex-col { flex-direction: column; }
.flex-row-reverse { flex-direction: row-reverse; }
.flex-col-reverse { flex-direction: column-reverse; }

// ═══════════════════════════════════════════════════════════
// Flex Wrapping
// ═══════════════════════════════════════════════════════════

.flex-wrap { flex-wrap: wrap; }
.flex-nowrap { flex-wrap: nowrap; }
.flex-wrap-reverse { flex-wrap: wrap-reverse; }

// ═══════════════════════════════════════════════════════════
// Flex Alignment
// ═══════════════════════════════════════════════════════════

// Align items (vertical in row, horizontal in column)
.items-start { align-items: flex-start; }
.items-center { align-items: center; }
.items-end { align-items: flex-end; }
.items-stretch { align-items: stretch; }
.items-baseline { align-items: baseline; }

// Justify content (horizontal in row, vertical in column)
.justify-start { justify-content: flex-start; }
.justify-center { justify-content: center; }
.justify-end { justify-content: flex-end; }
.justify-between { justify-content: space-between; }
.justify-around { justify-content: space-around; }
.justify-evenly { justify-content: space-evenly; }

// ═══════════════════════════════════════════════════════════
// Flex Grow/Shrink
// ═══════════════════════════════════════════════════════════

.flex-grow { flex: 1; }
.flex-grow-0 { flex-grow: 0; }
.flex-shrink-0 { flex-shrink: 0; }
.flex-shrink { flex-shrink: 1; }

// ═══════════════════════════════════════════════════════════
// Composite Flex Patterns (MOST USEFUL!)
// ═══════════════════════════════════════════════════════════

.flex-center {
  @include flex-center;
}

.flex-between {
  @include flex-between;
}

.flex-col-center {
  @include flex-column-center;
}

.flex-col {
  @include flex-column;
}

.flex-row {
  @include flex-row;
}

// ═══════════════════════════════════════════════════════════
// Position Utilities
// ═══════════════════════════════════════════════════════════

.relative { position: relative; }
.absolute { position: absolute; }
.fixed { position: fixed; }
.sticky { position: sticky; }
.static { position: static; }

// Position shorthands
.inset-0 {
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
}

// ═══════════════════════════════════════════════════════════
// Pointer/Cursor
// ═══════════════════════════════════════════════════════════

.pointer-events-none { pointer-events: none; }
.pointer-events-auto { pointer-events: auto; }
.cursor-pointer { cursor: pointer; }
.cursor-default { cursor: default; }
.cursor-not-allowed { cursor: not-allowed; }

// ═══════════════════════════════════════════════════════════
// Opacity Utilities
// ═══════════════════════════════════════════════════════════

.opacity-0 { opacity: 0; }
.opacity-50 { opacity: 0.5; }
.opacity-100 { opacity: 1; }

// ═══════════════════════════════════════════════════════════
// Shadow Utilities
// ═══════════════════════════════════════════════════════════

.shadow-none { box-shadow: none; }
.shadow-sm { box-shadow: var(--shadow-sm); }
.shadow-md { box-shadow: var(--shadow-md); }
.shadow-lg { box-shadow: var(--shadow-lg); }
.shadow-xl { box-shadow: var(--shadow-xl); }

// ═══════════════════════════════════════════════════════════
// User Select
// ═══════════════════════════════════════════════════════════

.select-none { user-select: none; }
.select-text { user-select: text; }
.select-all { user-select: all; }

// ═══════════════════════════════════════════════════════════
// Transform Utilities
// ═══════════════════════════════════════════════════════════

.scale-95 { transform: scale(0.95); }
.scale-100 { transform: scale(1); }
.scale-110 { transform: scale(1.1); }

.translate-y-1 { transform: translateY(0.25rem); }
.translate-y-2 { transform: translateY(0.5rem); }
.-translate-y-1 { transform: translateY(-0.25rem); }
.-translate-y-2 { transform: translateY(-0.5rem); }

// ═══════════════════════════════════════════════════════════
// ZIndex
// ═══════════════════════════════════════════════════════════

.z-0 { z-index: 0; }
.z-50 { z-index: var(--z-overlay); }
.z-55 { z-index: var(--z-modal); }
.z-60 { z-index: var(--z-dropdown); }
.z-70 { z-index: var(--z-tooltip); }
```

---

## 📄 FILE 8: `index.scss`

```scss
// src/styles/index.scss
// Global SCSS Entry Point - Import All

// Import in order of dependency

@import 'variables';
@import 'transitions';
@import 'mixins';
@import 'typography';
@import 'spacing';
@import 'borders';
@import 'utilities';

// ═══════════════════════════════════════════════════════════
// HOST STYLING (All Components)
// ═══════════════════════════════════════════════════════════

// Default component container styling
:host {
  display: block;
  width: 100%;
}

// Alternative host variants
:host(.full-width) {
  width: 100%;
}

:host(.flex) {
  @include flex-center;
}

:host(.inline) {
  display: inline-block;
}

// ═══════════════════════════════════════════════════════════
// GLOBAL RESETS & BASE STYLES
// ═══════════════════════════════════════════════════════════

* {
  box-sizing: border-box;
}

html {
  font-size: 16px;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

body {
  margin: 0;
  padding: 0;
  background: var(--background);
  color: var(--color-text-primary);
  font-family: var(--font-sans, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-normal);
  line-height: 1.5;
}

// ═══════════════════════════════════════════════════════════
// FORM RESETS
// ═══════════════════════════════════════════════════════════

input,
textarea,
select,
button {
  font: inherit;
}

button {
  border: none;
  background: none;
  cursor: pointer;
}

// ═══════════════════════════════════════════════════════════
// END OF GLOBAL STYLES
// ═══════════════════════════════════════════════════════════
```

---

## 🔧 ANGULAR.JSON CONFIGURATION

Update `angular.json` stylePreprocessorOptions:

```json
{
  "projects": {
    "quest100frontend": {
      "architect": {
        "build": {
          "builder": "@angular-devkit/build-angular:browser",
          "options": {
            "outputPath": "dist/quest100frontend",
            "index": "src/index.html",
            "main": "src/main.ts",
            "polyfills": ["zone.js"],
            "tsConfig": "tsconfig.app.json",
            "assets": ["public"],
            "styles": ["src/styles/index.scss", "src/styles.css"],
            "scripts": [],
            "stylePreprocessorOptions": {
              "includePaths": ["src/styles"]
            }
          }
        },
        "serve": {
          "builder": "@angular-devkit/build-angular:dev-server",
          "configurations": {
            "development": {
              "browserTarget": "quest100frontend:build:development",
              "proxyConfig": "proxy.conf.json"
            }
          },
          "defaultConfiguration": "development"
        }
      }
    }
  }
}
```

---

## 📝 COMPONENT USAGE EXAMPLES

### BEFORE (leaderboard.css - 60+ regels):
```css
.flex-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 2rem;
}

.header-title {
  font-size: 1.8rem;
  font-weight: 800;
  color: #5aaab4;
  margin: 0;
}

.btn-create {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: #5aaab4;
  color: white;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: filter 0.15s;
}
```

### AFTER (leaderboard.scss - 10 regels):
```scss
@import 'variables';
@import 'mixins';

.header-title {
  font-size: var(--font-size-heading-lg);
  font-weight: var(--font-weight-extrabold);
  color: var(--color-text-dark);
  margin: 0;
}

.btn-create {
  @include button-primary;
  gap: var(--spacing-sm);
  
  &:hover:not(:disabled) {
    border-bottom-width: 2px;
  }
}
```

**BESPARING: 50 regels!! 🎉**

---

## ✅ NEXT STEPS

1. Maak de `src/styles/` directory aan
2. Copy alle 8 SCSS-bestanden hierboven
3. Update `angular.json`
4. Run: `ng build` - zou zonder fouten moeten werken!
5. Migreer één component CSS naar SCSS als test
6. Controleer visueel dat alles hetzelfde eruit ziet

---

**Status:** Ready to implement! ✅

