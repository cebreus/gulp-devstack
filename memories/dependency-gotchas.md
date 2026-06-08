## Native Postinstall Dependencies Require pnpm allowBuilds Entries

- **Date Discovered:** 2026-05-26 UNKNOWN
- **Category:** Dependency
- **Context/Manifestation:** This repo carries native or build-time packages such as `sharp`, `esbuild`, `@parcel/watcher`, `gifsicle`, `mozjpeg`, and `optipng-bin`, and the workspace root now contains `pnpm-workspace.yaml` with explicit `allowBuilds` entries for them. During validation, install-time failures around native postinstall/build steps were a real issue, and the current repo state relies on that allowlist being present.
- **Rule:** Do not remove or bypass `pnpm-workspace.yaml` `allowBuilds` entries for the native/postinstall toolchain; installs and validation depend on those packages being permitted to run their build scripts.

## Duplicate sharp libvips Builds Trigger Runtime Warning Noise

- **Date Discovered:** 2026-05-26 UNKNOWN
- **Category:** Dependency
- **Context/Manifestation:** Multiple `pnpm test` runs in this repo emitted Objective-C runtime warnings that `GNotificationCenterDelegate` was implemented in two different `@img/sharp-libvips-darwin-arm64` dylibs at once. The root cause is that the dependency tree can contain more than one libvips package revision for `sharp`, so macOS loads duplicate native libraries during image-related tests.
- **Rule:** When touching the image toolchain or lockfile, check for duplicate `@img/sharp-libvips-darwin-arm64` versions. If the warning reappears or worsens, treat it as a dependency dedupe problem in the `sharp` native stack, not as an application-logic regression.

## pnpm Overrides Must Live In pnpm-workspace.yaml

- **Date Discovered:** 2026-05-26 UNKNOWN
- **Category:** Dependency
- **Context/Manifestation:** During the `favicons -> sharp` dedupe fix, `corepack pnpm@11.1.3 install --lockfile-only` warned that the `pnpm` field in `package.json` was no longer read and ignored `pnpm.overrides`. The override started working only after it was moved to the root `pnpm-workspace.yaml`, where the lockfile then recorded `overrides: favicons>sharp: 0.34.5`.
- **Rule:** In this repo, dependency overrides must be declared in the root `pnpm-workspace.yaml`, not in `package.json`, or pnpm will ignore them.

## Nunjucklinter Banner Output Must Be Filtered Through The Wrapper

- **Date Discovered:** 2026-06-08 UNKNOWN
- **Category:** Dependency
- **Context/Manifestation:** The `nunjucklinter` CLI used by this repo prints informational banners such as `Linting directory: ...` and `Linting file: ...` before real results. That noise was unwanted in `pnpm run lint:templates` and `pnpm run format:templates`, so the repo now routes both scripts through `scripts/run-njklint.js`, which removes only those banner lines while preserving real errors, fix output, and exit status.
- **Rule:** Run Nunjucks linting through `scripts/run-njklint.js`, not the raw `njklint` binary, when invoking the repo's template lint/format scripts.
