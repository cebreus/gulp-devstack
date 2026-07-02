## Native Postinstall Dependencies Require pnpm allowBuilds Entries

- **Date Discovered:** 2026-05-26 UNKNOWN
- **Category:** Dependency
- **Context/Manifestation:** Repo use native packages (`sharp`, `esbuild`, `@parcel/watcher`, `gifsicle`, `mozjpeg`, `optipng-bin`). Install fail without `allowBuilds` in `pnpm-workspace.yaml`.
- **Rule:** Keep `allowBuilds` entries in `pnpm-workspace.yaml`. Install need them.

## Duplicate sharp libvips Builds Trigger Runtime Warning Noise

- **Date Discovered:** 2026-05-26 UNKNOWN
- **Category:** Dependency
- **Context/Manifestation:** `pnpm test` emit Objective-C warning `GNotificationCenterDelegate` implemented twice. macOS load duplicate `sharp-libvips` dylibs.
- **Rule:** Check duplicate `@img/sharp-libvips-darwin-arm64` in lockfile. Warning = dedupe problem, not logic bug.

## pnpm Overrides Must Live In pnpm-workspace.yaml

- **Date Discovered:** 2026-05-26 UNKNOWN
- **Category:** Dependency
- **Context/Manifestation:** The package manager ignores `pnpm.overrides` in `package.json`. Overrides only work in `pnpm-workspace.yaml`.
- **Rule:** Put dependency overrides in `pnpm-workspace.yaml`, not `package.json`.

## Nunjucklinter Banner Output Must Be Filtered Through The Wrapper

- **Date Discovered:** 2026-06-08 UNKNOWN
- **Category:** Dependency
- **Context/Manifestation:** `nunjucklinter` CLI print noisy banner lines. `scripts/run-njklint.js` wrapper strip noise, keep real output/status.
- **Rule:** Use `scripts/run-njklint.js` for lint/format, not raw `njklint`.

## Playwright Binary Provisioning

- **Date Discovered:** 2026-06-11
- **Category:** Dependency
- **Context/Manifestation:** Playwright binaries not auto-install with `pnpm install`. E2E tests fail.
- **Rule:** Run `playwright install chromium` in `package.json` `postinstall`.
