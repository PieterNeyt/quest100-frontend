# CSS Refactoring Plan - Quest100 Frontend

**Analyse-datum:** 22 maart 2026  
**Status:** Klaar voor implementatie

---

## 📊 ANALYSE SAMENVATTING

### Kwantitatieve Statistieken

| Metriek | Waarde |
|---------|--------|
| **CSS-bestanden** | 33 |
| **Totale CSS-regels** | 12.954 |
| **Gedupliceerde regels** | 6.226 (48.06%) |
| **Unieke CSS-regels** | 1.719 |
| **Potentieel bespaard** | ~48% van totale volume |
| **Gedupliceerde regels over files** | 684 |

### Größte Probleem-Bestanden (Top 5)

1. **userlist.css** (808 regels) - 175 gedupliceerde regels
2. **gotcha-kill-feed.css** (757 regels) - 148 gedupliceerde regels
3. **gotcha-end-screen.css** (740 regels) - 129 gedupliceerde regels
4. **leaderboard.css** (703 regels) - 198 gedupliceerde regels
5. **gotcha-page.css** (689 regels) - 149 gedupliceerde regels

---

## 🎨 GEIDENTIFICEERDE HERHAALDE STIJLEN

### 1. **Flexbox-Patronen (Hyper-gedupliceerd)**

#### Top Flex-Rules:
- `display: flex` → **414x** voorkomen
- `align-items: center` → **357x** voorkomen
- `flex-direction: column` → **132x** voorkomen
- `justify-content: center` → **129x** voorkomen
- `display: inline-flex` → **87x** voorkomen
- `flex-shrink: 0` → **83x** voorkomen

**Status:** WAARSCHUWING - Deze basisregel is door het hele project verspreid. Candidate voor CSS-klassen of mixin.

**Aanbeveling:** Maak utility-klassen (`flex-center`, `flex-col`, etc.) of SCSS-mixins.

---

### 2. **Kleuren (252 unieke kleuren)**

#### Top 15 gebruikte Kleuren:

| Kleur | Frequentie | Aanbeveling |
|-------|-----------|------------|
| `#5aaab4` | 136x | **CSS-variabele** `--color-primary` |
| `oklch(0.25 0.02 264)` | 47x | **CSS-variabele** `--color-dark-text` |
| `#ef4444` | 37x | **CSS-variabele** `--color-danger` |
| `#538d4e` | 35x | **CSS-variabele** `--color-success` |
| `#dc2626` | 31x | **CSS-variabele** `--color-danger-dark` |
| `oklch(0.55 0.02 264)` | 30x | **CSS-variabele** `--color-text-secondary` |
| `oklch(0.5 0.02 264)` | 30x | **CSS-variabele** `--color-text-muted` |
| `#fff` | 26x | **CSS-variabele** `--color-white` |
| `rgba(90, 170, 180, 0.25)` | 26x | **CSS-variabele** `--color-primary-alpha-25` |
| `rgba(90, 170, 180, 0.3)` | 23x | **CSS-variabele** `--color-primary-alpha-30` |

**Status:** Deels gehandeld in `styles.css` maar inconsistent gebruikt met hardcoded waarden.

**Probleem:** Veel components gebruiken hardcoded kleuren i.p.v. `var(--*)` verwijzingen.

---

### 3. **Spacing (451 unieke spacing-waarden)**

#### Top Spacing-Patronen:

| Rule | Frequentie |
|------|-----------|
| `width: 100%` | 79x |
| `margin: 0` | 73x |
| `gap: 0.75rem` | 51x |
| `gap: 0.5rem` | 50x |
| `gap: 0.4rem` | 48x |
| `gap: 1rem` | 40x |
| `gap: 0.3rem` | 28x |
| `width: 0` | 26x |
| `gap: 0.6rem` | 24x |
| `gap: 0.35rem` | 21x |

**Status:** Veel ad-hoc spacing; geen consistent systeem zichtbaar.

**Probleem:** Spacing-waarden zijn niet genormaliseerd (0.3rem, 0.35rem, 0.4rem, 0.45rem, etc.).

---

### 4. **Border-Radius (31 unieke waarden)**

#### Top Border-Radius Waarden:

| Waarde | Frequentie | Aanbeveling |
|--------|-----------|------------|
| `10px` | 66x | `--radius-md` |
| `8px` | 57x | `--radius-sm` |
| `50%` | 55x | `--radius-full` |
| `12px` | 36x | `--radius-lg` |
| `20px` | 34x | `--radius-xl` |
| `16px` | 24x | `--radius-2xl` |
| `999px` | 20x | `--radius-full` |
| `9px` | 16x | `--radius-md` |

**Status:** Veel waarden kunnen geconsolideerd worden.

---

### 5. **Font-Sizes (52 unieke waarden)**

#### Top Font-Sizes:

| Waarde | Frequentie | Omschrijving |
|--------|-----------|------------|
| `0.72rem` | 28x | Extra klein (xs) |
| `0.82rem` | 28x | Klein (sm) |
| `0.85rem` | 27x | Klein-medium |
| `0.88rem` | 27x | Klein-medium |
| `0.95rem` | 26x | Basis |
| `0.8rem` | 26x | Klein |
| `clamp(1.8rem, 3vw, 2.6rem)` | 3x | Responsive groot |

**Status:** PROBLEEM - Te veel font-sizes, veel keer dicht bij elkaar (0.72, 0.78, 0.8, 0.82, 0.84, 0.85, 0.86, 0.88...).

**Aanbeveling:** Standaardiseer tot 6-8 font-sizes (xs, sm, base, lg, xl, 2xl, 3xl).

---

### 6. **Font-Weights (9 waarden)**

| Waarde | Frequentie |
|--------|-----------|
| `700` | 125x |
| `800` | 83x |
| `600` | 66x |
| `500` | 30x |
| `900` | 25x |
| `400` | 4x |

**Status:** Goed, maar kan naar 4 standardwaarden (400, 500, 600, 700).

---

### 7. **Transitions (62 unieke waarden)**

#### Top Transitions:

| Rule | Frequentie |
|------|-----------|
| `all 0.15s` | 24x |
| `border-color 0.2s, box-shadow 0.2s` | 14x |
| `background 0.15s, color 0.15s` | 13x |
| `background 0.15s` | 9x |
| `filter 0.15s, transform 0.1s` | 8x |

**Status:** Veel herhaalde transitions; candidate voor mixins.

---

### 8. **Border-Styles (Veel duplicatie)**

#### Top Border-Rules:

| Rule | Frequentie |
|------|-----------|
| `border: 1.5px solid var(--border)` | 73x |
| `border-radius: 10px` | 66x |
| `border-radius: 8px` | 54x |

**Status:** Border-stijlen zijn pseudo-genormaliseerd met `var(--border)`, maar nog veel hardcoded border-widths en radius-waarden.

---

### 9. **Display & Layout Basisregels**

#### Top Display-Rules:

| Rule | Frequentie |
|------|-----------|
| `display: flex` | 414x |
| `align-items: center` | 357x |
| `flex-direction: column` | 132x |
| `justify-content: center` | 129x |
| `overflow: hidden` | 65x |
| `display: inline-flex` | 87x |

---

## 💡 COMPONENT-SPECIFIEKE STIJLEN (Écht Uniek)

### Categories van echte component-CSS:

1. **Game-componenten** (sudoku, minesweeper, nerdle, qrcode):
   - Spel-grid-layouts
   - Cell-stijlen specifiek voor spellogica
   - Animaties voor spel-interacties

2. **Gotcha-componenten** (gotcha-page, gotcha-end-screen, gotcha-kill-feed):
   - Gotcha-specifieke kaart-layouts
   - Kill-feed animaties
   - Game-status-indicators

3. **Dashboard & Reports** (dashboard, report-award, report-chat, report-event):
   - Custom tabel-layouts
   - Report-kaart-variaties
   - Data-visualisatie-stijlen

4. **Modal-componenten** (leaderboard-modal, no-class-modal):
   - Modal-speficieke overlays
   - Modal-animaties
   - Modal-content-layouts

---

## 🔧 REFACTORING-PLAN

### Fase 1: Setup SCSS Variabelen & Mixins (Priority: 🔴 HOOG)

**Bestanden die aangemaakt moeten worden:**

```
src/styles/
├── _variables.scss          # CSS custom properties (kleurenpalette, spacing, etc.)
├── _typography.scss         # Font-sizes, font-weights, line-heights
├── _spacing.scss            # Margin, padding, gap systeem
├── _transitions.scss        # Animation & transition definitions
├── _mixins.scss             # Herbruikbare SCSS-mixins
├── _borders.scss            # Border-radius en border-stijlen
├── _utilities.scss          # Utility-klassen (flex patterns, etc.)
└── index.scss               # Import-hub
```

### Fase 2: Angular StylePreprocessorOptions Configuratie

**Bewerk `angular.json`:**

```json
{
  "projects": {
    "quest100frontend": {
      "architect": {
        "build": {
          "options": {
            "stylePreprocessorOptions": {
              "includePaths": [
                "src/styles"
              ]
            }
          }
        }
      }
    }
  }
}
```

**Voordeel:** Alle components kunnen `@import '_variables.scss'` gebruiken zonder relatieve paden.

### Fase 3: Extraheer Herhaalde Stijlen

#### 3a. **Kleuren naar `_variables.scss`**

```scss
// src/styles/_variables.scss

:root {
  /* Primaire kleuren */
  --color-primary: #5aaab4;
  --color-primary-dark: #4a8f98;
  --color-primary-light: #8cc8d2;
  --color-primary-alpha-12: rgba(90, 170, 180, 0.12);
  --color-primary-alpha-15: rgba(90, 170, 180, 0.15);
  --color-primary-alpha-25: rgba(90, 170, 180, 0.25);
  --color-primary-alpha-30: rgba(90, 170, 180, 0.3);
  --color-primary-alpha-45: rgba(90, 170, 180, 0.45);

  /* Status kleuren */
  --color-success: #538d4e;
  --color-danger: #ef4444;
  --color-danger-dark: #dc2626;
  --color-warning: #f59e0b;

  /* Text kleuren */
  --color-text-dark: oklch(0.25 0.02 264);
  --color-text-secondary: oklch(0.55 0.02 264);
  --color-text-muted: oklch(0.5 0.02 264);
  --color-text-light: oklch(0.6 0.02 264);

  /* Spacing schaal */
  --spacing-xs: 0.25rem;   /* 4px */
  --spacing-sm: 0.5rem;    /* 8px */
  --spacing-md: 0.75rem;   /* 12px */
  --spacing-lg: 1rem;      /* 16px */
  --spacing-xl: 1.5rem;    /* 24px */
  --spacing-2xl: 2rem;     /* 32px */

  /* Border-radius */
  --radius-sm: 8px;
  --radius-md: 10px;
  --radius-lg: 12px;
  --radius-xl: 16px;
  --radius-2xl: 20px;
  --radius-full: 50%;

  /* Font-sizes */
  --font-size-xs: 0.72rem;
  --font-size-sm: 0.82rem;
  --font-size-base: 0.95rem;
  --font-size-lg: 1.1rem;
  --font-size-xl: 1.4rem;
  --font-size-2xl: 1.6rem;

  /* Font-weights */
  --font-weight-normal: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;
  --font-weight-bold: 700;
  --font-weight-extrabold: 800;

  /* Transitions */
  --transition-fast: 0.1s;
  --transition-base: 0.15s;
  --transition-slow: 0.2s;
  --ease-in-out: ease-in-out;
}
```

#### 3b. **Spacing naar `_spacing.scss`**

```scss
// src/styles/_spacing.scss

/* Margin resets */
.m-0 { margin: 0; }

/* Flex gap utilities */
.gap-xs { gap: var(--spacing-xs); }
.gap-sm { gap: var(--spacing-sm); }
.gap-md { gap: var(--spacing-md); }
.gap-lg { gap: var(--spacing-lg); }
.gap-xl { gap: var(--spacing-xl); }
.gap-2xl { gap: var(--spacing-2xl); }
```

#### 3c. **Flexbox naar `_utilities.scss`**

```scss
// src/styles/_utilities.scss

/* Flex basis */
.flex { display: flex; }
.flex-row { flex-direction: row; }
.flex-col { flex-direction: column; }
.flex-wrap { flex-wrap: wrap; }
.flex-nowrap { flex-wrap: nowrap; }

/* Flex alignment */
.items-center { align-items: center; }
.items-start { align-items: flex-start; }
.items-end { align-items: flex-end; }
.items-stretch { align-items: stretch; }

.justify-center { justify-content: center; }
.justify-start { justify-content: flex-start; }
.justify-end { justify-content: flex-end; }
.justify-between { justify-content: space-between; }

/* Flex grow/shrink */
.flex-shrink-0 { flex-shrink: 0; }
.flex-grow { flex: 1; }

/* Common patterns */
.flex-center {
  display: flex;
  align-items: center;
  justify-content: center;
}

.flex-between {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.flex-col-center {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
```

#### 3d. **Transitions naar `_transitions.scss`**

```scss
// src/styles/_transitions.scss

@mixin transition-all {
  transition: all var(--transition-base) var(--ease-in-out);
}

@mixin transition-colors {
  transition: background-color var(--transition-base), 
              color var(--transition-base),
              border-color var(--transition-base);
}

@mixin transition-transform {
  transition: transform var(--transition-base),
              filter var(--transition-fast);
}

.transition-all { @include transition-all; }
.transition-colors { @include transition-colors; }
.transition-transform { @include transition-transform; }
```

#### 3e. **Typography naar `_typography.scss`**

```scss
// src/styles/_typography.scss

.text-xs { font-size: var(--font-size-xs); }
.text-sm { font-size: var(--font-size-sm); }
.text-base { font-size: var(--font-size-base); }
.text-lg { font-size: var(--font-size-lg); }
.text-xl { font-size: var(--font-size-xl); }
.text-2xl { font-size: var(--font-size-2xl); }

.font-normal { font-weight: var(--font-weight-normal); }
.font-medium { font-weight: var(--font-weight-medium); }
.font-semibold { font-weight: var(--font-weight-semibold); }
.font-bold { font-weight: var(--font-weight-bold); }
.font-extrabold { font-weight: var(--font-weight-extrabold); }
```

#### 3f. **Borders naar `_borders.scss`**

```scss
// src/styles/_borders.scss

.rounded-sm { border-radius: var(--radius-sm); }
.rounded-md { border-radius: var(--radius-md); }
.rounded-lg { border-radius: var(--radius-lg); }
.rounded-xl { border-radius: var(--radius-xl); }
.rounded-2xl { border-radius: var(--radius-2xl); }
.rounded-full { border-radius: var(--radius-full); }

.border-base {
  border: 1.5px solid var(--border);
}

@mixin button-border {
  border: 1.5px solid var(--border);
  border-radius: var(--radius-lg);
}
```

#### 3g. **Mixins naar `_mixins.scss`**

```scss
// src/styles/_mixins.scss

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

@mixin button-primary {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-md) var(--spacing-lg);
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: var(--radius-lg);
  font-weight: var(--font-weight-bold);
  font-size: var(--font-size-base);
  cursor: pointer;
  @include transition-transform;
  
  &:hover:not(:disabled) {
    filter: brightness(1.06);
    transform: translateY(-1px);
  }
  
  &:active:not(:disabled) {
    transform: translateY(2px);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

@mixin input-base {
  width: 100%;
  padding: var(--spacing-md) var(--spacing-lg);
  background: var(--background);
  border: 1.5px solid var(--border);
  border-radius: var(--radius-lg);
  font-size: var(--font-size-base);
  font-family: inherit;
  
  &:focus {
    outline: none;
    border-color: var(--color-primary);
  }
}
```

### Fase 4: Refactor Component CSS Files

**Voorbeeld: leaderboard.css → leaderboard.scss**

**VOOR:**
```css
.btn-create {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: #5aaab4;
  color: white;
  border: none;
  border-bottom: 4px solid #4a8f98;
  border-radius: 12px;
  font-weight: 700;
  font-size: 0.95rem;
  cursor: pointer;
  transition: filter 0.15s, transform 0.1s;
  white-space: nowrap;
  letter-spacing: 0.2px;
  font-family: inherit;
}
.btn-create:hover:not(:disabled) {
  filter: brightness(1.06);
  transform: translateY(-1px);
}
```

**NA:**
```scss
@import '_variables.scss';
@import '_mixins.scss';

.btn-create {
  @include button-primary;
  border-bottom: 4px solid var(--color-primary-dark);
  white-space: nowrap;
  letter-spacing: 0.2px;
  
  &:hover:not(:disabled) {
    border-bottom-width: 2px;
  }
}
```

**Besparing:** 16 lijnen → 4 lijnen (75% minder code)

### Fase 5: :host en ::ng-deep Optimalisatie

#### Huidige Patroon (Probleem):
```css
/* leaderboard.css */
:host {
  display: block;
  width: 100%;
}

/* Dan opnieuw in every component... */
```

#### Optimalisatie: Centraal in `_utilities.scss`:
```scss
/* src/styles/_utilities.scss */
:host {
  display: block;
  width: 100%;
}

:host(.full-width) {
  width: 100%;
}

:host(.flex) {
  @include flex-center;
}
```

#### Erkenning van ::ng-deep probleem:
Geen ::ng-deep gebruik gedetecteerd in analyse - Dit is positief! 🎉

---

## 📋 IMPLEMENTATIE CHECKLIST

### Stap 1: Maak SCSS-bestanden aan
- [ ] `src/styles/_variables.scss`
- [ ] `src/styles/_typography.scss`
- [ ] `src/styles/_spacing.scss`
- [ ] `src/styles/_transitions.scss`
- [ ] `src/styles/_mixins.scss`
- [ ] `src/styles/_borders.scss`
- [ ] `src/styles/_utilities.scss`
- [ ] `src/styles/index.scss`

### Stap 2: Update angular.json
- [ ] Voeg `stylePreprocessorOptions` toe met `includePaths: ["src/styles"]`

### Stap 3: Converteer component CSS naar SCSS (Priority volgorde)

**Tier 1 (Hoog potentieel - groot + veel duplicatie):**
- [ ] userlist.css (808 regels)
- [ ] leaderboard.css (703 regels)
- [ ] gotcha-page.css (689 regels)
- [ ] minesweeper.css (632 regels)
- [ ] nerdle.css (616 regels)

**Tier 2 (Medium):**
- [ ] dashboard.css + report-award/chat/event.css
- [ ] alle game-componenten

**Tier 3 (Kleine wins):**
- [ ] components-CSS (chat, event-form, etc.)

### Stap 4: Valideer en test
- [ ] Geen visuele regressie
- [ ] Build succesvol
- [ ] CSS-bestandsgrootte verminderd

### Stap 5: Documentatie
- [ ] Update component guidelines
- [ ] Voorbeelden van CSS-klassen toevoegen
- [ ] Team training

---

## 📈 VERWACHTE RESULTATEN

| Metriek | Huidig | Na Refactoring | Besparing |
|---------|--------|----------------|-----------|
| **Totale CSS-lijnen** | 12.954 | ~6.700 | ~48% |
| **userlist.css** | 808 lijnen | ~400 lijnen | ~51% |
| **leaderboard.css** | 703 lijnen | ~350 lijnen | ~50% |
| **CSS bestandsgrootte** | ~185 KB | ~96 KB | ~48% |
| **Onderhoudsbaarheid** | Laag | Hoog | ✅ |
| **DRY score** | 52% | ~95% | ✅ |

---

## ⚠️ MIGRATIE-VOORZORGSMAATREGELEN

1. **Backwards Compatibility:**
   - Behoud alle huidige CSS-variabelen (die al in `styles.css` zijn)
   - Voeg geleidelijk SCSS-variabelen toe

2. **Testing:**
   - Run `ng build` voor elke component-migratie
   - Controleer visueel op wijzigingen

3. **Git Strategie:**
   - Maak een `refactor/css-consolidation` branch
   - Commit per component of bestandsgroep
   - Pull request voor review

4. **Rollback Plan:**
   - Als iets breekt, git revert naar vorige versie
   - CSS is non-critical; UI blijft werken

---

## 🎯 Volgende Stappen

1. **Maak SCSS-bestanden aan** (Fase 1)
2. **Update angular.json** (Fase 2)
3. **Migreer top-5 grote bestanden** (Fase 3)
4. **Test en valideer**
5. **Volledig refactoring-proces**
6. **Team-kennisuitwisseling**

---

**Gemaakt op:** 2026-03-22  
**Analyse tool:** Node.js CSS Parser Script  
**Status:** Klaar voor implementatie ✅

