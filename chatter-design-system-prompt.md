# Chatter UI Design System & Agent Prompt
> Feed this entire document to your Kiro Claude agent as a system prompt or pre-task instruction.

---

## THE PROBLEM WITH YOUR CURRENT UI

Your Chatter landing page has the "AI bland" syndrome:
- Purple-on-lavender gradient → the default AI color scheme
- Inter/system-ui fonts → invisible, forgettable
- Perfectly centered, symmetric hero → no tension, no character
- Generic feature cards with icons → seen on 10,000 SaaS sites
- Zero motion, zero personality

This document gives you a design system and a prompt to fix all of it.

---

## AGENT SYSTEM PROMPT (paste this at the top of every Kiro task)

```
You are a senior product designer and frontend engineer who creates UNFORGETTABLE interfaces. 
You NEVER produce generic "AI aesthetics." You always commit to a bold, specific design direction
and execute it with precision.

BANNED forever (never use these):
- Color scheme: purple/violet gradient on white or lavender background
- Fonts: Inter, Roboto, Arial, system-ui, -apple-system, Space Grotesk
- Layout: perfectly centered hero with big bold text + subtitle + two CTA buttons
- Components: generic icon-in-circle + title + subtitle feature cards
- Buttons: flat rounded rectangle with solid purple fill
- Backgrounds: solid white or f5f5f5 gray

REQUIRED for every component/page you build:
1. Pick a strong aesthetic direction BEFORE writing any code (see directions below)
2. Choose a distinctive font pairing (see font system below)
3. Use the spatial composition rules (see layout system)
4. Add meaningful motion (see animation system)
5. Every interactive element must have a micro-interaction

When in doubt: be MORE opinionated, not less.
```

---

## DESIGN DIRECTIONS (pick one per session)

Tell your agent: *"Use design direction: [NAME]"*

### 1. EDITORIAL DARK
- **Vibe**: High-end tech magazine, Vercel/Linear energy
- **Background**: `#0A0A0A` or `#111111`
- **Text**: Off-white `#F2F0EB`, muted `#888`
- **Accent**: Single electric color — `#00FF94` (mint) or `#FF3D00` (orange) or `#5B8EE6` (blue)
- **Fonts**: `Instrument Serif` (headings) + `DM Mono` (UI text)
- **Layout**: Asymmetric grid, content bleeds to edge, large typographic hierarchy

### 2. ORGANIC WARM  
- **Vibe**: Calm, trustworthy, human — Notion/Superhuman energy
- **Background**: `#FAF7F2` (warm paper)
- **Text**: `#1A1614` (near black warm), `#6B5E56` (warm gray)
- **Accent**: `#D4622A` (terracotta) or `#2D6A4F` (forest)
- **Fonts**: `Fraunces` (headings, optical size) + `Plus Jakarta Sans` (body)
- **Layout**: Generous whitespace, natural asymmetry, subtle texture via CSS

### 3. BRUTAL MINIMAL
- **Vibe**: Raw, confident, no nonsense — Figma/Stripe energy  
- **Background**: Pure `#FFFFFF`
- **Text**: `#000000` (full black)
- **Accent**: A single thick colored border/rule, never fills
- **Fonts**: `Syne` (headings, condensed at large sizes) + `IBM Plex Mono` (everything else)
- **Layout**: Hard grid, lots of whitespace, borders as structure, no rounded corners

### 4. RETRO FUTURISM
- **Vibe**: 70s NASA + current tech aesthetic
- **Background**: `#F5F0E8` (aged paper) or `#1C1C1C`
- **Text**: Match background era
- **Accent**: `#E8762B` (burnt orange) + `#2B4EE8` (electric blue)
- **Fonts**: `Space Grotesk` ONLY for this style (it fits here), display at `letter-spacing: -0.04em`
- **Layout**: Geometric shapes as decoration, horizontal rules, numerical labels

### 5. LIQUID GLASS (current Apple HIG)
- **Vibe**: Frosted depth, iOS 18 aesthetic
- **Background**: Deep gradient mesh `135deg, #0D0D1A 0%, #1A0D2E 50%, #0D1A1A 100%`
- **Accent**: Pure white at varying opacities
- **Fonts**: `Mona Sans` (Apple-adjacent) + `SF Pro` fallback chain
- **Components**: `backdrop-filter: blur(20px)`, white borders at 0.1–0.2 opacity

---

## FONT SYSTEM

Add these Google Fonts imports to every project:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Mono:wght@300;400;500&family=Fraunces:opsz,wght@9..144,300;9..144,400;9..144,600&family=Plus+Jakarta+Sans:wght@300;400;500;600&family=Syne:wght@400;600;700;800&family=IBM+Plex+Mono:wght@300;400;500&display=swap" rel="stylesheet">
```

**Usage rules:**
- Display headings: `font-size: clamp(3rem, 8vw, 7rem)` — never fixed px for hero text
- Letter spacing for bold headings: `letter-spacing: -0.03em` to `-0.05em`
- Subheadings: `font-weight: 300` or `400` — never bold subheadings
- Body: `line-height: 1.65`, `font-size: clamp(1rem, 1.5vw, 1.125rem)`
- Monospace UI labels: `font-size: 0.75rem`, `letter-spacing: 0.08em`, `text-transform: uppercase`

---

## COLOR SYSTEM

```css
:root {
  /* EDITORIAL DARK theme */
  --bg-primary: #0A0A0A;
  --bg-secondary: #141414;
  --bg-tertiary: #1E1E1E;
  --bg-surface: rgba(255, 255, 255, 0.04);
  --bg-surface-hover: rgba(255, 255, 255, 0.07);
  
  --text-primary: #F2F0EB;
  --text-secondary: #888880;
  --text-tertiary: #555550;
  
  --accent: #00FF94;          /* Change per direction */
  --accent-dim: rgba(0, 255, 148, 0.12);
  --accent-border: rgba(0, 255, 148, 0.3);
  
  --border-subtle: rgba(255, 255, 255, 0.06);
  --border-default: rgba(255, 255, 255, 0.1);
  --border-strong: rgba(255, 255, 255, 0.2);
  
  /* Functional */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 16px;
  --radius-pill: 100px;
}
```

---

## LAYOUT SYSTEM

### The Grid
```css
.layout {
  display: grid;
  grid-template-columns: 1fr min(720px, 100%) 1fr;
  /* Content goes in column 2, bleed elements span all 3 */
}

/* Asymmetric hero — NEVER use text-align: center on hero */
.hero {
  display: grid;
  grid-template-columns: 1fr 0.7fr;
  gap: 4rem;
  align-items: end;
  padding: clamp(4rem, 12vh, 8rem) 0;
}
```

### Section Spacing
- Sections: `padding-block: clamp(5rem, 12vw, 10rem)`
- Between elements within section: `gap: clamp(1.5rem, 3vw, 2.5rem)`
- Never equal top/bottom padding — use `padding-top: 8rem; padding-bottom: 5rem` for visual tension

### The "Off-Center" Rule
Hero content should start at ~10-15% from the left, never centered. Use `padding-left: clamp(1.5rem, 8vw, 8rem)`.

---

## COMPONENT SYSTEM

### Feature Cards (NOT the generic icon + title + text)

**Option A: Numbered Statement Cards**
```css
.feature-card {
  position: relative;
  padding: 2.5rem;
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  overflow: hidden;
  background: var(--bg-surface);
  transition: border-color 0.3s, background 0.3s;
}
.feature-card:hover {
  border-color: var(--border-default);
  background: var(--bg-surface-hover);
}
.feature-card .number {
  font-family: 'DM Mono', monospace;
  font-size: 0.7rem;
  letter-spacing: 0.1em;
  color: var(--accent);
  margin-bottom: 1.5rem;
}
.feature-card h3 {
  font-family: 'Instrument Serif', serif;
  font-size: clamp(1.25rem, 2vw, 1.75rem);
  font-weight: 400;
  line-height: 1.3;
  margin-bottom: 1rem;
}
```

**Option B: Horizontal Rule Cards (brutal minimal)**
```css
.feature-item {
  display: grid;
  grid-template-columns: 80px 1fr;
  gap: 2rem;
  align-items: start;
  padding: 2rem 0;
  border-top: 1px solid var(--border-subtle);
}
.feature-item .label {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 0.7rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--text-tertiary);
  padding-top: 0.4rem;
}
```

### Buttons (NEVER flat rounded rectangle with solid fill)

**Option A: Ghost with animated border**
```css
.btn-primary {
  position: relative;
  padding: 0.875rem 2rem;
  font-family: 'DM Mono', monospace;
  font-size: 0.875rem;
  letter-spacing: 0.04em;
  color: var(--text-primary);
  background: transparent;
  border: 1px solid var(--border-default);
  border-radius: var(--radius-sm);
  cursor: pointer;
  overflow: hidden;
  transition: color 0.3s;
}
.btn-primary::before {
  content: '';
  position: absolute;
  inset: 0;
  background: var(--accent);
  transform: translateY(101%);
  transition: transform 0.3s cubic-bezier(0.76, 0, 0.24, 1);
}
.btn-primary:hover { color: #000; }
.btn-primary:hover::before { transform: translateY(0); }
.btn-primary span { position: relative; z-index: 1; }
```

**Option B: Text with animated arrow**
```css
.btn-link {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-family: 'DM Mono', monospace;
  font-size: 0.875rem;
  letter-spacing: 0.04em;
  color: var(--text-primary);
  text-decoration: none;
}
.btn-link .arrow {
  transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.btn-link:hover .arrow { transform: translate(4px, -4px); }
```

### Stat/Metric Display (replaces "Real-Time | 100% | 24/7")
```css
.stat-block {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1px;  /* border between items via gap + bg color trick */
  background: var(--border-subtle);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  overflow: hidden;
}
.stat-item {
  background: var(--bg-secondary);
  padding: 2rem 2.5rem;
}
.stat-item .value {
  font-family: 'Instrument Serif', serif;
  font-size: clamp(2.5rem, 5vw, 4rem);
  font-weight: 400;
  line-height: 1;
  color: var(--text-primary);
  margin-bottom: 0.5rem;
}
.stat-item .label {
  font-size: 0.8rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--text-secondary);
  font-family: 'DM Mono', monospace;
}
```

---

## ANIMATION SYSTEM

### Page Load (staggered reveal — do this for every section)
```css
@keyframes fadeUp {
  from { opacity: 0; transform: translateY(24px); }
  to   { opacity: 1; transform: translateY(0); }
}

.animate-in {
  animation: fadeUp 0.7s cubic-bezier(0.16, 1, 0.3, 1) both;
}
.animate-in:nth-child(1) { animation-delay: 0.1s; }
.animate-in:nth-child(2) { animation-delay: 0.2s; }
.animate-in:nth-child(3) { animation-delay: 0.3s; }
```

### Scroll-Triggered Reveal (use Intersection Observer)
```js
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
    }
  });
}, { threshold: 0.15 });

document.querySelectorAll('[data-reveal]').forEach(el => observer.observe(el));
```
```css
[data-reveal] {
  opacity: 0;
  transform: translateY(20px);
  transition: opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1),
              transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
}
[data-reveal].visible { opacity: 1; transform: none; }
```

### Text Scramble Effect (for hero headlines — use sparingly)
```js
class TextScramble {
  constructor(el) {
    this.el = el;
    this.chars = '!<>-_\\/[]{}—=+*^?#________';
  }
  setText(newText) {
    const old = this.el.innerText;
    const len = Math.max(old.length, newText.length);
    return new Promise(resolve => {
      let frame = 0;
      const total = 20;
      const tick = () => {
        let output = '';
        for (let i = 0; i < len; i++) {
          if (i < newText.length) {
            const progress = frame / total;
            const revealAt = i / len;
            if (progress > revealAt + 0.2) {
              output += newText[i];
            } else {
              output += this.chars[Math.floor(Math.random() * this.chars.length)];
            }
          }
        }
        this.el.innerText = output;
        if (frame++ < total) requestAnimationFrame(tick);
        else resolve();
      };
      tick();
    });
  }
}
```

---

## BACKGROUND EFFECTS

### Noise Texture Overlay (adds depth without heaviness)
```css
body::before {
  content: '';
  position: fixed;
  inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E");
  pointer-events: none;
  z-index: 1000;
  opacity: 0.4;
}
```

### Gradient Mesh Background (for dark themes)
```css
.bg-mesh {
  background-color: #0A0A0A;
  background-image: 
    radial-gradient(ellipse 60% 40% at 20% 30%, rgba(0, 255, 148, 0.07) 0%, transparent 60%),
    radial-gradient(ellipse 50% 50% at 80% 70%, rgba(91, 142, 230, 0.05) 0%, transparent 60%);
}
```

### Horizontal Rule as Section Divider (brutal minimal)
```css
.section-marker {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 3rem;
}
.section-marker::before {
  content: '';
  flex: 0 0 40px;
  height: 1px;
  background: var(--accent);
}
.section-marker span {
  font-family: 'DM Mono', monospace;
  font-size: 0.7rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--text-tertiary);
}
```

---

## CHATTER-SPECIFIC REDESIGN BRIEF

When rebuilding the Chatter landing page, tell your agent:

```
Rebuild the Chatter (messaging app) landing page using Design Direction: EDITORIAL DARK.

Specific requirements:
1. HERO: Left-aligned, not centered. Headline uses Instrument Serif at ~7rem, italic for "Anyone, Anywhere". 
   Small mono tag above the headline: "// MESSAGING PLATFORM". 
   Single ghost-button CTA with fill-on-hover animation. No "Learn More" button.

2. STATS ROW: Use the stat-block component (grid separated by 1px lines).
   Values: "1ms" / "E2E" / "∞" with mono labels below. NO colored values.

3. FEATURES: Use numbered statement cards in a 2-column grid (not 3).
   Each card has a 2-digit number (01, 02...) in accent color, serif headline, 
   short prose description. No icons.

4. CTA SECTION: Full-width dark card. Large serif question. 
   Smaller mono answer below. Single CTA. Asymmetric padding.

5. ALL text reveals on scroll using Intersection Observer.
6. Add noise texture overlay to the body.
7. Hero headline gets text-scramble effect on page load.
```

---

## QUICK REFERENCE: WHAT TO SAY VS WHAT NOT TO SAY

| Instead of saying... | Say this... |
|---|---|
| "make it look modern" | "Use Editorial Dark direction, Instrument Serif + DM Mono, left-aligned hero" |
| "add some animations" | "Add scroll-triggered fadeUp reveals with 0.15s stagger between children" |
| "make it more colorful" | "Use a single accent color (#00FF94) sparingly — only on labels and hover states" |
| "improve the typography" | "Hero at clamp(3rem, 8vw, 7rem), -0.04em letter-spacing, Instrument Serif italic for key phrase" |
| "better buttons" | "Ghost button with translateY fill animation on hover, DM Mono text, 4px border-radius" |
| "nice cards" | "Numbered statement cards: mono 01/02 label in accent, serif h3, no icons, 1px border" |

---

*Design system version 1.0 — Chatter / March 2026*
