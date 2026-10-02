# Granny Clone

A 3D game built with Next.js, React Three Fiber, WebGPU and Rapier physics.

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Tuning and debugging

The Leva panel in the top-right corner has a **Debug** toggle that shows physics colliders and light helpers, plus Lighting sliders. Values saved from the **Tuning** folder are written to `public/tuning.json` (only under `npm run dev`).

## Scripts

| Script           | What it does                          |
| ---------------- | ------------------------------------- |
| `npm run dev`    | Start the dev server                  |
| `npm run build`  | Build for production                  |
| `npm run check`  | Type check, lint and check formatting |
| `npm run format` | Fix lint issues and format every file |

## Project docs

- [`CONTEXT.md`](./CONTEXT.md): the glossary of project terms
- [`CLAUDE.md`](./CLAUDE.md): architecture, conventions and constraints
