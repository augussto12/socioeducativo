# 📱 QA Checklist — Mobile-First Verification

## 📐 Resoluciones a testear

| Dispositivo | Ancho | DPR | Notas |
|------------|-------|-----|-------|
| iPhone SE | 375px | 2 | Mínimo viable |
| iPhone 14 | 390px | 3 | Más popular |
| iPhone 14 Pro Max | 430px | 3 | Más grande |
| Samsung Galaxy S21 | 360px | 3 | Android popular |
| iPad Mini | 768px | 2 | Breakpoint tablet |
| iPad Pro | 1024px | 2 | Breakpoint desktop |
| Desktop | 1440px | 1 | Desktop estándar |

## 🛠️ Herramientas DevTools

1. **Chrome DevTools → Toggle device toolbar** (Ctrl+Shift+M)
2. **Lighthouse** → Audit → Categories: Performance, Accessibility, Best Practices
3. **Performance tab** → Record page load → Check CLS markers
4. **Network tab** → Throttle to "Slow 3G" → Verify lazy loading
5. **Accessibility tree** → Inspect → Check ARIA attributes

---

## ✅ 10 Escenarios Críticos Mobile

### 1. Login Page (375px)
- [ ] Page fills full viewport without scroll (100dvh)
- [ ] Input fields are at least 16px font-size (no iOS zoom)
- [ ] "Ingresar" button is at least 48px tall
- [ ] Animated orbs don't overflow
- [ ] Error message is visible and readable
- [ ] Form is centered vertically

### 2. Team Dashboard — Hero Card (360px)
- [ ] Shield image loads with lazy attribute
- [ ] Team name doesn't overflow (text wraps or truncates)
- [ ] Stats row (Jugadores, Torneos, Partidos) fits in one line
- [ ] Hero card doesn't exceed viewport width
- [ ] Confetti emojis don't block content

### 3. Next Match Spotlight (375px)
- [ ] Both team names are visible (truncated if needed)
- [ ] VS badge is centered
- [ ] Card doesn't overflow horizontally
- [ ] Touch-able area for the entire card

### 4. Bottom Navigation (390px)
- [ ] All 4 items visible and equally spaced
- [ ] Active indicator shows on current route
- [ ] Icons + labels don't overflow
- [ ] Safe area inset works on iPhone (no overlap with home bar)
- [ ] Tapping navigates instantly, no double-tap needed
- [ ] Hidden on desktop (768px+)

### 5. Standings Table Scroll (360px)
- [ ] Table scrolls horizontally
- [ ] Position (#) and Team name columns are sticky
- [ ] Scroll hint gradient visible on right edge
- [ ] Gradient disappears when scrolled to end
- [ ] Header row stays visible during vertical scroll
- [ ] Own team is highlighted with accent color

### 6. Fixture View — Collapsible Rounds (375px)
- [ ] Only active round is expanded by default
- [ ] Tapping summary opens/closes round (≥48px touch target)
- [ ] Match cards show full team names or truncate cleanly
- [ ] Completed rounds show ✅ indicator
- [ ] Scores are readable in monospace font

### 7. Admin Hamburger Menu (375px)
- [ ] Hamburger icon is 48x48px touch target
- [ ] 3-bar to X animation works smoothly
- [ ] Drawer slides in from left with overlay
- [ ] Overlay click closes drawer
- [ ] Nav links close drawer on tap
- [ ] Sidebar is always visible on desktop (≥768px)
- [ ] aria-expanded toggles correctly

### 8. Admin Modal — Fullscreen Mobile (360px)
- [ ] Modal slides up from bottom on mobile
- [ ] Content scrolls if longer than viewport
- [ ] Close button (×) is at least 48px
- [ ] Action buttons stack vertically (cancel below submit)
- [ ] safe-area-inset-bottom is respected
- [ ] Score inputs in result modal are large (≥70px)
- [ ] Number inputs don't trigger extra browser spinners

### 9. Skeleton Loaders
- [ ] Full-page skeleton shows on initial load
- [ ] Skeleton matches the shape of actual content (no jarring shift)
- [ ] Shimmer animation runs smoothly
- [ ] Skeleton is properly hidden once data loads
- [ ] CLS < 0.1 on all pages

### 10. Toast Notifications (390px)
- [ ] Toast appears at bottom-center on mobile
- [ ] Toast doesn't overlap with BottomNav
- [ ] Toast is readable (adequate font size + contrast)
- [ ] Toast auto-dismisses after ~3.5s
- [ ] On desktop: toast appears top-right

---

## 🎯 Lighthouse Targets

| Metric | Target | Tool |
|--------|--------|------|
| Performance | > 85 | Lighthouse |
| CLS | < 0.1 | Lighthouse |
| LCP | < 2.5s | Lighthouse |
| Accessibility | > 90 | Lighthouse |
| Best Practices | > 90 | Lighthouse |

---

## ♿ Accessibility Checklist

- [ ] Every page has exactly one `<h1>`
- [ ] Skip-to-content link appears on Tab press
- [ ] All emoji-only buttons have `aria-label`
- [ ] All decorative emojis have `aria-hidden="true"`
- [ ] Focus ring (2px solid accent) is visible on Tab navigation
- [ ] Tab order follows visual layout
- [ ] Drawer has `aria-expanded` state
- [ ] All tabs have `role="tab"` and `aria-selected`
- [ ] All modals have `role="dialog"` or `aria-label`
- [ ] All images have `alt` or empty `alt=""` for decorative
- [ ] Color contrast meets WCAG AA (4.5:1 for normal text, 3:1 for large)
- [ ] `<nav>`, `<main>`, `<section>`, `<article>`, `<header>`, `<footer>` used correctly
- [ ] `prefers-reduced-motion` media query disables animations

---

## 📱 Touch-Specific Tests

- [ ] All buttons/links are minimum 48x48px
- [ ] No :hover-only effects (all have :active or :focus-visible too)
- [ ] Inputs don't trigger iOS zoom (font-size ≥ 16px)
- [ ] `touch-action: manipulation` on interactive elements
- [ ] No horizontal scroll on any page (except intentional table scroll)
- [ ] Pull-to-refresh doesn't conflict with native browser behavior

---

## 🚀 Performance Tests

- [ ] Lazy loading: only current route chunk loads initially
- [ ] Images have `loading="lazy"` + explicit `width`/`height`
- [ ] Fonts use `font-display: swap`
- [ ] No unused CSS loaded (modular per component)
- [ ] No `console.log` in production

---

## 🔄 Testing Workflow

1. Start dev server: `npm run dev`
2. Open Chrome DevTools → Toggle Device Mode
3. Test each scenario above at 360px, 390px, and 768px
4. Run Lighthouse audit on each main page:
   - `/login`
   - `/team` (dashboard)
   - `/team/standings`
   - `/team/tournaments`
   - `/admin` (dashboard)
   - `/admin/tournaments/:id` (matches)
5. Fix any issues found
6. Re-test after fixes
7. Run `npm run build` to ensure production build succeeds
