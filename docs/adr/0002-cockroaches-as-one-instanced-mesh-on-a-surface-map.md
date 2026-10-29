# Cockroaches as one instanced mesh walking a surface map

The Cockroaches Haunt shows about 100 animated Cockroaches (up to 400) crawling over the Floor, walls and roof of both Corridors, each on its own erratic path. We draw them all as one `InstancedMesh` whose `idle` and `walking` clips are baked at load into a vertex animation texture (every vertex's position and normal at every frame), so each instance picks its own clip blend and phase in the vertex shader. They move on a surface map: each Corridor's cross-section (Floor, the wall profile with baseboard, panel, Ledge, plaster and molding, the roof's vault) is unrolled into one flat strip, so a Cockroach is a 2D point (along the Corridor, around the cross-section) doing a random walk, and turning that point into a position and tilt is a table lookup. Columns, Door Frames, Paintings and Props are rectangles on that strip that the walk turns away from; the two strips meet through a portal on the Corner's Floor.

## Considered Options

- **One `SkinnedMesh` clone per Cockroach.** Rejected: 100 to 400 draw calls, each lit by every Flame Light, plus one skeleton update per Cockroach per frame. three cannot instance a skinned mesh.
- **Splines.** Rejected: a spline is a path fixed in advance. Cockroaches run, stop dead, turn sharply, follow each other and scatter from the Player, so their path is decided frame by frame; a spline per Cockroach would still need the stops, turns and obstacle avoidance on top, and could not leave its curve to flee.
- **Walking the real meshes** (raycasts or a navigation mesh over the Kit's geometry). Rejected: far more work and cost for a 7 cm bug, and still fragile at the wall details. The unrolled strip handles the details exactly because they run unbroken along every wall; only columns break that, and those are obstacles.

## Consequences

- Only the baked clips can play. Adding a clip (`death_start`, the flying ones) means baking it into the texture too.
- The material writes the baked pose into `positionLocal` and `normalLocal` before three's instancing runs (`setupPosition`), because a `positionNode` is applied after instancing and would discard the instance matrices.
- Cockroaches cannot cross a column or the Corner's cross vault, and the Door Wall is closed to them: anything whose cross-section differs from the strip's profile is an obstacle, not a surface.
- A new Piece or Prop that stands out from a wall or the Floor must be added to the obstacles, or Cockroaches will walk through it.
