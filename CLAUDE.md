# Granny Clone

A 3D game built with Next.js 15, React 19, React Three Fiber, WebGPU and Rapier physics. The scene is currently empty: canvas, lights, physics world, orbit camera, Leva Tuning and the Debug toggle.

**Read `CONTEXT.md` before naming anything.** Use its terms in code, UI text and conversation, and avoid the words listed under _Avoid_.

## Commands

- `npm run dev`: dev server on http://localhost:3000
- `npm run check`: type check, ESLint and Prettier check. Run it before calling any work done.
- `npm run format`: ESLint autofix, then Prettier
- `npm run build`: production build

There is no test suite yet.

## Structure

Code is organized by feature, not by kind of file. `src/app` holds only routing.

| Folder       | Holds                                                                                             |
| ------------ | ------------------------------------------------------------------------------------------------- |
| `src/app`    | `layout.tsx`, `page.tsx` (a server component rendering `<World />`), global CSS                   |
| `src/world`  | `World` (client boundary: canvas, Leva panel, physics, orbit camera), WebGPU canvas, lights       |
| `src/input`  | Input helpers shared across features: `useKeyHeld` and `readGamepad`                              |
| `src/tuning` | `useTuningControls` (Leva with saved defaults), Save/Revert buttons, `public/tuning.json` loading |
| `src/debug`  | Debug mode toggle and the `slider` helper for Leva                                                |

New features get their own folder (for example `src/player` or `src/enemy`) with their components and hooks together.

## Input

- `readGamepad()` (`input/gamepad.ts`) reads the first connected gamepad and returns a `GamepadState`: both sticks, both triggers and `pressed(button)`. With no gamepad it returns everything at rest, so callers never check for one.
- Buttons are named by position (`south`, `east`, `west`, `north`, bumpers, d-pad, `select`, `start`, stick presses), not by a brand's letters.
- Sticks are -1..1 with a deadzone, `x` positive to the right and `y` positive up (forward). Triggers are 0..1.
- It handles both the browser's `standard` mapping and unmapped pads (Linux reports triggers as axes).
- Gamepads are polled, not event driven: call `readGamepad()` inside `useFrame`, before the physics step (priority -1) when the result drives physics. Browsers only expose a gamepad after one of its buttons is pressed with the page open.

## Conventions

- **Zero comments.** Express intent through names, extracted functions and named constants. Explanations of tuning values go in Leva hints (the last argument of `slider`). The lint rule only allows `eslint-disable` directives.
- **Hooks hold the logic**; components stay mostly markup.
- **"Tuning" means Leva sliders.** Each feature owns one `use<Feature>Tuning` hook, built with `useTuningControls` (never `useControls` directly) so saved values from `public/tuning.json` become the defaults. Save in the Leva "Tuning" folder writes that file through `PUT /api/tuning`, which only works under `npm run dev`.
- **Debug visuals** (collider wireframes, light helpers) are gated by `useDebugMode()`, which is off by default.
- Named exports everywhere, except the default exports Next.js requires in `src/app`.
- `"use client"` only at the client boundary, `world/World.tsx`.
- `@/` imports across folders, relative imports within a folder.
- Magic numbers become named constants.

## Formatting

Prettier (no semicolons, 100 columns) plus ESLint. The Claude Code hook `.claude/hooks/format-edited-file.sh` runs ESLint autofix and Prettier on every file Claude edits, and reports remaining lint errors back.

- Objects and type literals with 4 or more properties go one per line; up to 3 stay inline. ESLint enforces this.
- Prettier always collapses imports, destructuring and JSX props when they fit, so those are not enforced.
- If `object-curly-newline` keeps failing on an inline type annotation, extract a named type.
- ESLint deliberately allows `any` and unused variables. Do not turn those rules back on.

## Constraints

- The dev server uses webpack, not Turbopack, because Turbopack runs worse on the owner's machine. Do not add `--turbopack`.
- Next.js stays on 15.3 until an upgrade is done as its own task.
- Leva must stay at 0.10.1 or later: in 0.10.0, slider hints crash the panel with "`Tooltip` must be used within `TooltipProvider`".
- The renderer is `three/webgpu` with a WebGL fallback. Use node materials and TSL, not `ShaderMaterial`, GLSL or WebGL-only postprocessing.

## Verifying changes

1. Run `npm run check`.
2. For anything visual or physical, run `npm run dev` and open the page in a browser (use the Chrome DevTools MCP when available). Confirm the canvas renders and the console has no errors. Turn on Debug in the Leva panel to see colliders and light helpers.
