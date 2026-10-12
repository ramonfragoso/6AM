# 6AM

A 3D game built with React Three Fiber, WebGPU and Rapier physics.

## Language

Add each term here as it is introduced, with the words to _Avoid_.

- **Player**: the person playing, seen in first person. The camera sits at the Player's eye height. _Avoid_: character, hero, user, avatar.
- **Floor**: the walkable oak plank surface, made of the Kit's `floor` pieces, with its top at y = 0. _Avoid_: ground, plane, terrain.
- **Model**: a `.glb` file in `public/models`, exported from Blender and compressed (KTX2 textures, meshopt geometry). Load it with `useModel`. _Avoid_: asset, mesh file.
- **Kit**: the Model `public/models/kit.glb`, exported from the Blender collection "Modular Kit". Its Pieces snap together like bricks and share one set of textures. _Avoid_: tileset, asset pack.
- **Piece**: one reusable part of the Kit (walls `wall_2m`/`wall_4m`/`wall_6m` and `wall_end`, `column`, `column_corner`, `column_narrow`, `door`, `door_frame`, `drain`, `roof`, `roof_corner`, `floor`, `floor_tile_1`, `floor_tile_2`, `floor_division`, `painting_frame_1`/`_2`/`_3`, `square_table_set`, `round_table_set`, `chair`, `lantern`), a `prefab_<piece>` empty in Blender and a `kit_<piece>` node in the Model. Its origin sits at floor level; wall Pieces have it on the wall's centerline with their inner side facing +Z. Walls are placed only as column variants (`wall_4m__col_start`, `__col_end`, `__col_both`; the 2 m wall only as `wall_2m__col_both`, in the Corner) that differ only in their baked AO. _Avoid_: prefab (outside Blender), block, tile, module.
- **Placement**: one Piece put in the world: which Piece, its position and its rotation around Y. A layout is a list of Placements. _Avoid_: instance, spawn.
- **Corridor**: walls of 2, 4 or 6 m end to end with column pairs and Door Frames where its Corridor Layout asks. The House has two: the first runs from the fixed start door to the Corner (2.4 m wide, oak Floor, drains); the second runs from the Corner to the fixed end door (2.1 m wide, Floor Tiles, Narrow Columns). Built by `houseLayout`. Its left and right walls are named as seen walking from the start door toward the Corner. _Avoid_: hallway, hall, passage.
- **Corridor Layout**: the text describing one Corridor (wall lengths, `|` for a column pair, `F` for a Door Frame). The House's are fixed: `6 | 4 F 6` before the Corner and `6 | 4 | 6` after it. Doors are not part of it. _Avoid_: spec, pattern, map.
- **Corner**: the fixed right turn after the first Corridor: a 2 m square with Corner Columns on the turn side, a column pair on the far side, the 2.4 m end wall, `roof_corner` and a Floor Division across the opening. _Avoid_: junction, bend, turn piece.
- **Corner Column**: `column_corner`, a column with all four sides finished, used at the Corner. The one next to the end wall is `column_corner__far`, the same column with its own baked AO. **Narrow Column**: `column_narrow`, the same column turned 90°, used between walls in the second Corridor. _Avoid_: pillar.
- **Door Frame**: `door_frame`, the door Piece without the door leaf and knob, placed with `F`. _Avoid_: doorway, arch.
- **Door Wall**: the second Corridor's middle 4 m wall on the right, replaced by `wall_4m_door`, a plain plaster wall with a real doorway cut through it (Model `public/models/wall_4m_door.glb`), holding the Kit's Door Frame without its plaster door walls and a **Door Leaf** (leaf, knob, keyhole) that swings open around its hinge from Leva Door Wall `open`. _Avoid_: side door, door frame (that is the `F` Piece), opening.
- **Floor Division**: `floor_division`, the engraved strip between column pairs in the second Corridor and across the Corner opening. _Avoid_: threshold, grout strip.
- **Floor Tiles**: the second Corridor's checkerboard of single-tile Pieces, `floor_tile_1` (dark glass) and `floor_tile_2` (crystal), 4 across and about 0.4 m deep, each with a small random tilt, yaw and texture offset. _Avoid_: checker piece, slab.
- **Painting**: a framed picture hung on a Corridor wall: a Picture Frame Piece plus one painting texture from `public/models/paintings`, chosen per hung Painting so it can be swapped at runtime. _Avoid_: picture, artwork, image (for the hung object).
- **Painting Group**: Paintings hung together on one wall and moved as one from Leva: the two wide ones stacked on the first Corridor's left wall, the row of three tall ones on its right wall. _Avoid_: gallery, set, cluster.
- **Picture Frame**: `painting_frame_1`/`_2`/`_3`, the frame Pieces with their canvas; every Painting of a frame shares its size. Its origin is the center of its back, on the wall's surface. _Avoid_: frame (alone, it clashes with Door Frame), border.
- **Prop**: a Piece placed from Leva instead of by a Corridor Layout: the Table Sets and the Chair (moved, turned and sized freely, and solid) and the Lanterns. _Avoid_: decoration, object, asset.
- **Table Set**: one Piece holding a table with everything on it (books, bottles, candles), so moving or resizing it keeps the arrangement. `square_table_set` stands in the first Corridor, `round_table_set` in the second. _Avoid_: table group, still life.
- **Coat Rack**: the Model `public/models/coat_rack.glb` (Blender collection "coat_rack": a wooden rack with a cloth hanging on it and a bowler hat on top), a Prop moved, turned and sized from Leva Props › Coat Rack and solid through a cylinder collider on its pole. Its origin is on the Floor under the pole. _Avoid_: hat stand, hanger.
- **Chair**: `chair`, the wooden chair in the second Corridor. _Avoid_: seat.
- **Lantern**: `lantern`, hung on every column of the first Corridor and on one column of the second: its first column on the right wall (Leva Props › Tiled Lantern). Its origin is the column's origin, so it reuses the column's Placement. _Avoid_: lamp, sconce.
- **Crucifix**: the Model `public/models/crucifix.glb` (Blender collection "crucifix": a brass cross and the Christ figure), hung on the face of the end door, in the Corridor that ends in it. Its origin is the center of the cross's back on the door's face, so `size` scales it in place; Leva Crucifix sets `height` and `size`. _Avoid_: cross (alone, it names only the brass part), statue, icon.
- **Fire**: the animated volumetric flame (THREE.Fire) burning on a candle or Lantern wick, placed at the Piece's `anchor_fire_*` Anchor. Each Fire has one **Flame Light**, a point light with static shadows. _Avoid_: flame tip, wick light.
- **Candle Set**: a Piece (`candle_set_top_left`, `_top_right`, `_bottom_left`, `_bottom_right`) holding about 17 wax candles. The top ones stand on the `wall_bottom_details` ledge of a wall, the bottom ones on the Floor in front of it; all four are authored in one 2 m bay of the first Corridor. Each wick is a fire Anchor, and each Candle Set has one **Candle Set Light**, a point light whose world x and z are tuned from Leva; the bottom sets' lights cast static shadows, the top sets' do not. _Avoid_: candle group, candle cluster.
- **Anchor**: an empty named `anchor_*` inside a Piece that marks a spot for the game, exported as a `kit_<piece>__anchor_*` node. _Avoid_: socket, marker, locator.
- **Kit Surface**: the shading every Kit material gets in the game: baked AO, baked grime and world-space variation, with strengths in Leva. _Avoid_: shader, post effect.
- **Swatch**: one material baked by the export into a repeating texture tile (base color, ORM, normal). _Avoid_: atlas, texture set.
- **Walk**: the Player moving across the Floor (forward/back and strafing). _Avoid_: move, run.
- **Look**: turning the Player's view (yaw and pitch). _Avoid_: aim, rotate camera.
- **DebugPlayer**: a bodiless Player for inspecting the scene. It passes through everything and shows its coordinates in the bottom-right corner while viewed. _Avoid_: free camera, noclip, spectator, ghost.
- **Fly**: the DebugPlayer moving in any direction: forward follows its Look, plus straight up and down. _Avoid_: noclip, float.
- **Viewpoint**: which of the Player or DebugPlayer the camera sits in, picked in the Leva Debug folder. Only the viewed one reads input. _Avoid_: active camera, perspective, mode.
- **Fog**: the volumetric haze drawn over the scene by `PostProcessing`, thickest near the Floor, with patches that drift, tuned in Leva Fog. _Avoid_: mist, smoke, scene.fog.
- **Lens**: the projection applied to the finished picture (Rectilinear, the normal one, or a fisheye such as Equidistant, or Panini), tuned in Leva Lens. _Avoid_: fisheye (alone, it names only some Lens projections), distortion, warp.
- **Field of view**: the camera's vertical angle, in degrees, from Leva Camera `fov`. _Avoid_: zoom, FOV (in UI text).
- **Dust**: the small white specks floating in the air around the camera, each with its own brightness and a slow twinkle, tuned in Leva Dust. _Avoid_: particles (in UI text), motes, snow.
- **Underfloor**: the black plane just under the Floor that closes the gaps between Pieces so the Fog cannot show through them. _Avoid_: ground plane, shadow plane, floor cover.
