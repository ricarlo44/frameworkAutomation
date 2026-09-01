# frameworkAutomation

TypeScript test automation for [teststore.blassacademy.com](https://teststore.blassacademy.com/),
a SauceDemo-style practice storefront. Login, cart, mobile-viewport, and API
coverage built on a single Playwright framework, with a CI pipeline and
recorded evidence for the longer flows.

## Stack and structure

Everything runs on **Playwright + TypeScript** -- one framework for web,
API, and mobile-viewport testing, instead of mixing tools.

```
src/
  config/
    env.ts       # store URL, API base URL, and test users, from .env or defaults
    devices.ts   # a hand-built Galaxy S25 device profile (see "Mobile strategy")
  pages/
    LoginPage.ts     # Page Object for the login screen
    ProductsPage.ts  # Page Object for the catalog + cart badge/buttons
tests/
  web/     # desktop Chromium: login, cart
  api/     # no browser: HTTP tests against a public practice API
  mobile/  # Chromium emulating a Galaxy S25: login, layout, a full purchase
docs/evidence/       # screenshot evidence referenced from DEFECT_REPORT.md
.github/workflows/    # the CI pipeline (see "CI pipeline" below)
DEFECT_REPORT.md      # the real defects found while building this suite
```

## Setup

```bash
npm ci
npx playwright install chromium
cp .env.example .env   # optional -- defaults already point at the public targets
```

Requires Node.js 20.6+ (uses the built-in `process.loadEnvFile`); built and
verified against Node 24. No secrets are involved: the store's login
credentials are published on its own login page, and the practice API is
public and unauthenticated.

## Running the suite

```bash
npm run typecheck   # tsc --noEmit
npm run test:web    # login + cart, desktop Chromium
npm run test:api    # API/contract tests
npm run test:mobile # login + layout + a full purchase, Galaxy S25 viewport
npm test             # all three projects
npm run report       # open the last HTML report
```

Reports and artifacts (all gitignored, nothing generated is committed):

- `playwright-report/` -- HTML report (`npm run report` to open)
- `test-results/results.json` -- machine-readable JSON report
- `test-results/<test>/` -- screenshot on failure for every test, plus a
  trace (`npx playwright show-trace test-results/<test>/trace.zip`); the
  two longest flows (`tests/web/cart-add-all.spec.ts` and
  `tests/mobile/shopping-flow.spec.ts`) additionally force a **video**
  regardless of pass/fail, since a single end-state screenshot would not
  show *where* in a long multi-step flow something went wrong.

### Expect one failing test today

`npm run test:mobile` reports **one failing test**:
`tests/mobile/responsive-layout.spec.ts` -- this is a real, reported defect
(see [`DEFECT_REPORT.md`](./DEFECT_REPORT.md)), not a broken test, and the
run correctly exits non-zero because of it. Every other test in all three
projects passes.

## The target site: what it actually is

`teststore.blassacademy.com` is a client-side React/Vite single-page app
with **no backend of its own** -- confirmed by recording every network
request across a full login → add-to-cart → checkout run: the only request
that ever leaves the browser is the initial page load. Login (3 fixed demo
users, credentials published on the login page itself), the product
catalog, the cart, and checkout are all simulated in-memory in the
frontend, the same way the original SauceDemo works.

That finding directly shaped two decisions below: the API suite runs
against a different, public target (see "Why dummyjson.com"), and the
mobile suite emulates a device viewport rather than provisioning a real
Android emulator (see "Mobile strategy") -- there is no native app to
install here, only a responsive website.

## Mobile strategy: viewport emulation, not a real emulator

"Test on a Galaxy S25" has two very different meanings, and picking the
wrong one would have meant building the wrong thing:

1. **A real Android emulator** (a full virtual phone, its own OS, its own
   Chrome install) -- the right tool when a *native app* needs installing,
   which is what the mobile-app half of a different assessment used. It is
   heavyweight (multi-GB, minutes to boot) and, critically, **most
   GitHub-hosted CI runners cannot run one at all** -- nested
   virtualization is unavailable on the free tier.
2. **Device viewport/UA emulation inside a desktop browser** -- what this
   project uses. Chromium is told to report a Galaxy S25's screen size,
   user-agent string, device pixel ratio, and touch input instead of a
   desktop's. It is the same mechanism as Chrome DevTools' device toolbar,
   just automated.

Since the store is a responsive website and not a native app, (2) is not
just lighter -- it is the *correct* layer: there is no "real Galaxy S25
app" to install, only a page that has to adapt to that screen size.

**Honest limitation:** this does not catch bugs specific to real hardware
(a particular GPU driver, actual Android/Chrome-for-Android quirks). It
does faithfully exercise responsive layout and touch interaction, which is
what actually broke here -- see the mobile defect below.

**Why a hand-built device profile:** Playwright's bundled device list tops
out at "Galaxy S24" (the S25 is newer than that data set), so
`src/config/devices.ts` defines the S25's real public specs (model
`SM-S931U`, Android 15, 1080x2340 @ 3x -- the same viewport class as the
S24) by hand instead of using a generic phone profile.

## Why dummyjson.com

The store has no backend to test (see above), so the API suite runs
against dummyjson.com, a public practice API covering the same shapes a
real e-commerce backend would (paginated user lists, CRUD, login/auth,
404s). **reqres.in was tried first** and initially worked, but its
anonymous/no-signup tier caps out at **40 requests/day per IP** -- it broke
on the very first full local run, and would have made the CI pipeline
flaky by design (a couple of pushes in one day is enough to exhaust it,
with no relation to any real bug). dummyjson.com was verified to handle a
20-request burst with no rate-limiting before committing to it.

## CI pipeline

`.github/workflows/playwright.yml` runs on every push and pull request to
`main`, plus a manual trigger (`workflow_dispatch`) from the Actions tab.

It runs the three Playwright projects (`web`, `api`, `mobile`) as **three
parallel jobs** via a matrix strategy, rather than one long sequential job:
total time is close to the slowest single project instead of the sum of
all three, and each project's pass/fail status is its own line in the
GitHub UI. `fail-fast: false` is deliberate: the mobile project's layout
defect is *expected* to fail, and that must not cancel the web/api jobs
mid-run.

Every job installs Node 24 (matching local development) with npm's cache
enabled, runs `npm ci` for a reproducible install, installs Chromium with
its Linux system dependencies (`--with-deps`), runs that project's tests,
then uploads the HTML report and the `test-results/` folder (screenshots,
forced videos, traces) as downloadable artifacts -- with `if: always()`,
so the evidence uploads even when a job fails, which is exactly when it's
most useful.

No environment variables or secrets are configured in the workflow: both
targets are public, and `src/config/env.ts` already falls back to their
real URLs whenever no `.env` file is present -- which is always true in
CI, since `.env` is gitignored.

### Running this against a different environment or from a different team

Nothing here is hardcoded to one person's machine or one fixed target:

- **Point it at a different environment:** every URL and test user comes
  from `src/config/env.ts`, which reads `STORE_URL`, `API_BASE_URL`,
  `STANDARD_USER`, `BLOCKED_USER`, `TIMEOUT_USER`, and `STORE_PASSWORD`
  from the environment (see `.env.example`). Locally, that's a `.env`
  file. In CI, the same effect is achieved with **GitHub Environments**
  (Settings → Environments → add variables, then add
  `environment: staging` under the job in the workflow) or plain
  **Actions Variables/Secrets** (Settings → Secrets and variables →
  Actions) referenced as `${{ vars.STORE_URL }}` -- no code changes
  needed either way, only configuration.
- **Another team running it standalone:** clone the repo, `npm ci`,
  `npx playwright install chromium`, `npm test`. The workflow file travels
  with the repo, so forking or cloning it into another GitHub account
  brings a working pipeline with it -- GitHub picks it up automatically
  from `.github/workflows/` the moment it's pushed, no separate setup step.
- **Gating merges on it:** Settings → Branches → branch protection rule on
  `main` → require the `web tests` / `api tests` / `mobile tests` status
  checks (each matrix leg reports its own check) before a PR can merge.
  Since the mobile layout defect is left failing on purpose, a real team
  would either fix that defect first or scope the required check to
  `web tests` and `api tests` only until it's resolved.
- **Manual runs:** the Actions tab's "Run workflow" button
  (`workflow_dispatch`), or `gh workflow run playwright.yml` from the
  GitHub CLI, run the pipeline without needing a new commit -- useful for
  re-confirming a fix, or for a QA lead re-running the suite on demand.
