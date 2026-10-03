# Snake

A neon-styled snake game built with Vite, React 19 and TypeScript. Canvas
rendering, no game framework, no runtime dependencies beyond React.

## Features

- 21×21 grid, canvas-rendered at device pixel ratio (capped at 2×)
- Arrow keys or WASD; swipe or tap the D-pad on touch devices
- Speed ramps up every 4 food, from 165ms down to a 60ms floor per tick
- High score persisted to `localStorage`
- Auto-pause when the tab loses focus or is hidden
- Responsive layout, respects `prefers-reduced-motion`

## Getting started

```bash
npm install
npm run dev
```

## Scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Vite dev server with HMR |
| `npm run build` | Type-check with `tsc -b`, then build to `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm test` | Run the engine test suite (17 checks, native Node type-stripping) |
| `npm run lint` | oxlint |
| `npm run typecheck` | `tsc -b` |

## Layout

```
src/
  game/
    types.ts     shared types and tuning constants
    engine.ts    pure game logic: step, steer, spawn, pause, scoring
  components/
    SnakeGame.tsx    game loop, input, persistence
    renderer.ts      all canvas drawing
    TouchControls.tsx  swipe + D-pad for mobile
tests/
  engine.test.ts     engine test suite
```

Game logic is isolated from rendering: `engine.ts` has no React or DOM
dependency and every function is pure, so it runs directly under Node.

## Deploying to Vercel

`vercel.json` pins the framework to `vite`, so Vercel never needs to guess
between the Vite and Python build paths. Build output goes to `dist/`.

### Via Git push (recommended)

1. Push this folder to a Git repository (GitHub, GitLab or Bitbucket).
2. In Vercel, choose **Add New → Project** and import that repository.
3. Leave the framework preset as **Vite** — `vercel.json` supplies the rest.
4. Click **Deploy**. Production deploys automatically on every push to the
   default branch; preview deploys are generated for other branches and pull
   requests.

### Via the Vercel CLI

```bash
npm install -g vercel
vercel          # first run: link the project
vercel --prod   # production deploy
```

## Notes

- `app.py` in the repo root is an unused stub. Delete it, or keep it —
  `vercel.json` pins the framework so it does not affect the build.
- Hashed assets under `/assets/` are served with a one-year immutable cache
  header; everything else is revalidated per deploy.