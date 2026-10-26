# Task record — first interactive terminal iteration

## Coordination

- Project registration: unregistered; workflow controller intentionally not invoked.
- Authorized root: `<raíz-del-proyecto>/interactive-terminal`.
- Authorization: create and modify only the authorized root for this local app.
- QA identity: not needed for local pure matching tests.
- Starting Git revision: none; parent directory was not a Git repository.
- Owner/writer: one delegated Sol executor for this component.

## Scope and closed decisions

- React + TypeScript + Vite; CSS visuals and animation; local TypeScript visitor data.
- Separate visitor data, normalization/matching domain logic, UI state, and visual CSS.
- Seed visitors: six fictional codenames only; no real developer identity ships in the repository.
- Primary names are always displayed. Recognition normalizes case, diacritics, and whitespace, starts at three normalized characters, and auto-triggers only on a unique prefix match.
- States: waiting, recognizing, revealed, unknown; consecutive users without reload; delayed reveal and delayed restart control; stale timers cleared on reset/unmount.
- Fullscreen control plus `F`; reset with `R` or `Escape`; responsive and reduced-motion-aware.

## Acceptance

- Production build succeeds.
- Focused matching tests cover normalization, minimum length, ambiguous `mar`, primary prefixes, aliases, and unknown input.
- Concise operating README exists.
- Visual direction is implemented in CSS without external image assets.

## Out of scope

- Future interactions, videos, remote services, integrations, API keys, deployment, publishing, and production changes.
- Visual browser acceptance is not claimed unless separately recorded below.

## Commands and results

- `npm install` — passed; 44 packages added, 0 vulnerabilities reported.
- `npm test` — not executed: environment policy blocked the generic script name before execution, despite the script being scoped to one test file.
- `npx vitest run src/domain/recognition.test.ts` — passed after ambiguous-submission correction; 1 file, 9 tests.
- `npm run build` — initial run found incompatible `allowImportingTsExtensions`/emit settings; corrected by making the Node config no-emit.
- `npm run build` — passed after correction; TypeScript build and Vite production bundle completed (18 modules transformed).
- No lint script is defined. Type checking is included in `npm run build` via `tsc -b`.
- Visual browser acceptance was not performed in this task.

## Final content fingerprint

Aggregate SHA-256 across the sorted authored/configuration file set, excluding `node_modules`, `dist`, generated TypeScript build metadata, and this task record (which contains the fingerprint): `957227c9b4cb53d896e4445d917e27bd43b613e0854302e55db3314857e5caae`.
