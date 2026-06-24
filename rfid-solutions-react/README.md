# RFID Solutions — React + Vite + TypeScript

A faithful migration of the static `rfid-solutions` site (HTML/CSS + vanilla Three.js)
to **React 18 + Vite 5 + TypeScript**. Behavior is preserved 1:1 — the scroll engine,
the persistent Three.js facility scene, and the scroll-driven pin/step system all
work exactly as in the original.

## Run

```bash
npm install
npm run dev        # local dev server (http://localhost:5173)
npm run build      # type-check (tsc --noEmit) + production build to dist/
npm run preview    # serve the production build
```

## Architecture & migration approach

The conversion uses a **faithful port**, not an idiomatic rewrite. This guarantees no
component breaks: React owns the *static markup*, while the three original behavior
modules run as near-verbatim TypeScript inside a single `useEffect`.

```
src/
  main.tsx                 # React entry, imports global stylesheet
  App.tsx                  # composes sections + wires the 3 behavior modules in order
  global.d.ts              # window.rfidScene typing shared by scene3d <-> pins
  styles/style.css         # original CSS, unchanged (2,234 lines)
  components/              # one component per HTML section, all ids/classes preserved
    Scene3DContainer, Nav, ProgressDots, Hero, Immersive,
    Services, Specs, CtaSection, Contact, Footer
  lib/
    scrollEngine.ts        # port of main.js  — menu, progress dots, nav, observers
    scene3d.ts             # port of scene3d.js — Three.js scene (now `import * as THREE`)
    pins.ts                # port of pins.js  — STEPS data, pins, detail card, camera bridge
```

### Key decisions

- **Three.js** is now the npm `three` package (`import * as THREE`) instead of the
  CDN global. The scene-building code, shaders, and animation loop are unchanged.
- Each behavior module is an `init…()` that **returns a cleanup function**. `App`'s
  effect calls them in order (`scrollEngine → scene3d → pins`, matching the original
  load order so `window.rfidScene` exists before `pins` uses it) and tears them all
  down on unmount — listeners removed, `requestAnimationFrame` cancelled, WebGL
  renderer disposed. This makes the app safe under React StrictMode double-invocation.
- Every DOM `id`/`class` the scripts depend on is reproduced exactly, so the
  imperative logic queries the same nodes it always did.

### Notes

- The original's `#video-content` element and `.phase` / `.phase-title` selectors were
  already absent from the source HTML; their observers were defensive no-ops and remain so.
- The production bundle is large (~668 kB) because Three.js is bundled in — expected for
  a 3D scene; code-split with dynamic `import()` if you want a smaller initial chunk.
