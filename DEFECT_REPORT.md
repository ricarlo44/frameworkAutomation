# Defect report

## Mobile: horizontal overflow on the product catalog

**Severity:** Medium. Not a crash and not blocking (all functionality
remains reachable), but it visibly clips content -- product names,
descriptions, and every "Agregar al carrito" button label are cut off
along the left edge of the screen -- on a mainstream phone viewport.

**Where:** `/products`, on any phone-width viewport. Reproduced on a
Galaxy S25 profile (360x780 CSS viewport, the real device's viewport
class).

**Precondition:** Logged in as any valid user.

**Steps to reproduce:**
1. Open `teststore.blassacademy.com` in a browser at a 360px-wide viewport
   (or resize DevTools' device toolbar to a Galaxy S25 / similarly-sized
   phone).
2. Log in with `standard_user` / `secret_blass_academy`.
3. Look at the product grid.

**Expected result:** The page's content fits the viewport width; no
horizontal scrolling is needed to read a product's name, description, or
price, or to reach its "Agregar al carrito" button.

**Actual result:** `document.documentElement.scrollWidth` is **468px**
against a **360px** `clientWidth` -- a 108px overflow. The `[data-test=
inventory-container]` product grid is the element responsible (confirmed
by walking the DOM for elements wider than the viewport). Visually, every
product card's left edge is pushed off-screen:

![Product grid overflowing a 360px-wide phone viewport](./docs/evidence/mobile-product-grid-overflow.png)

**Automated evidence:** `tests/mobile/responsive-layout.spec.ts` --
asserts `scrollWidth <= clientWidth` on the product catalog at the Galaxy
S25 viewport. Left failing on purpose (not marked `test.fail()`): this is
this phase's headline finding, and "a reproducible defect with an
automated failing test" is meant to be visible just by running the suite.
Run it directly with:

```bash
npx playwright test --project=mobile tests/mobile/responsive-layout.spec.ts
```

**Likely technical cause:** the product grid is very likely a CSS grid
with a fixed `minmax()` column width (a common pattern for a 2-column
product layout) that does not have a narrow-viewport breakpoint collapsing
it to a single column. A design-token/CSS-level fix (a media query
switching `grid-template-columns` to one column below ~400px) is the
expected fix, not a JavaScript change.

**Note on language consistency (not filed as its own defect, observed
during the same testing pass):** two strings render in English on an
otherwise Spanish site -- the "Invalid username." login error (see
`tests/web/login.spec.ts`, "a username that does not exist at all...")
and the mobile hamburger menu's "All Items" / "About" / "Logout" labels
(see `tests/mobile/login.spec.ts`). Cosmetic, but worth a follow-up
ticket.
