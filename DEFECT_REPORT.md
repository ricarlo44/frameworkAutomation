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

**Confirmed technical cause:** `[data-test="inventory-container"]` is a CSS
grid with **fixed-pixel columns and no narrow-viewport breakpoint** --
`grid-template-columns: 280px 280px` plus `padding: 32px` (32px each
side), computed directly from the live page. Two 280px columns + a 16px
gap + 64px of padding need 640px of width minimum, on a 360px-wide phone.
There is no media query anywhere collapsing this to one column.

**Suggested fix (verified, not deployed):**

```css
@media (max-width: 620px) {
  [data-test="inventory-container"] {
    grid-template-columns: 1fr;
    padding-left: 16px;
    padding-right: 16px;
  }
}
```

This is not a guess -- `tests/mobile/responsive-layout.spec.ts`'s second
test (`"the proposed CSS fix resolves the overflow"`) injects this same
rule client-side with Playwright's `addStyleTag()` on the live page and
re-measures the same `scrollWidth`/`clientWidth` check: **468px → 360px,
overflow eliminated**, with every product card's text and button fully
visible (see the "after" screenshot below). This does not modify
`teststore.blassacademy.com` itself -- there is no access to that site's
source or hosting -- it only proves what the real fix should look like and
that it works, for whoever owns that stylesheet to apply.

(The test adds `!important` to each declaration, defensively, since
`addStyleTag()` injects after the page's own stylesheet has already
loaded and there was no reason to rely on DOM-order cascade behavior
holding for the purpose of this proof. Applying the patch as shown above,
without `!important`, inside the site's own stylesheet was independently
re-verified to resolve the overflow the same way -- `!important` is not a
requirement of the fix itself, only an artifact of proving it via
after-the-fact injection.)

| Before | After (proposed fix injected) |
| --- | --- |
| ![Overflowing grid](./docs/evidence/mobile-product-grid-overflow.png) | ![Fixed grid, single column, no clipped text](./docs/evidence/mobile-product-grid-fixed.png) |

**Note on language consistency (not filed as its own defect, observed
during the same testing pass):** two strings render in English on an
otherwise Spanish site -- the "Invalid username." login error (see
`tests/web/login.spec.ts`, "a username that does not exist at all...")
and the mobile hamburger menu's "All Items" / "About" / "Logout" labels
(see `tests/mobile/login.spec.ts`). Cosmetic, but worth a follow-up
ticket.
