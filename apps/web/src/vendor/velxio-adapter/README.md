# Velxio Adapter Boundary

This folder is the only place where Circuit Lab may carry logic that was directly adapted from or intentionally modeled after the local `velxio-master` reference project.

Rules:
- Keep imported or adapted logic isolated here.
- Re-export stable utilities through `index.ts` so the rest of the app depends on this boundary, not individual vendor files.
- Do not move authored circuit state, project persistence, IDE orchestration, or simulator ownership into this folder.
- App-owned integration stays in `apps/web/src/lib/wiring/*` and `apps/web/src/components/ide/circuit-lab/*`.

Current scope:
- wire hit detection helpers
- wire offset/bundling helpers
