# Loop by Wrap between two fixed Safe Rooms

The House loops forever in both directions: whichever House door the Player walks through, they end up in the Start Room facing its door into the first Corridor, with the door they came through gone. We build this with two fixed Safe Rooms, the Start Room behind the start door and the End Room behind the Crucifix door, and a Wrap once the door has shut behind the Player: from the End Room to the same spot in the Start Room, or a half turn about the Start Room's center when they came in through the start door. Nothing is ever added, removed or moved while the game runs.

## Considered Options

- **Append a new House and Safe Room at each Crucifix door.** Rejected: every House copy adds about 16 Flame Lights, and changing the light count recompiles every shader (seconds of stall) and blows the shadow budget; every copy also changes the instance counts, so `KitInstances` re-creates its meshes and recompiles again. Removing old copies costs the same.
- **Move the House around a single Safe Room while the Player is inside.** Rejected: every collider, light, Prop and Leva world coordinate would have to follow the House, and every shadow map would re-render on each move.

## Consequences

- The End Room's far door is only for show and never opens; the Wrap happens before the Player can reach it. The Start Room's far wall shows the same door while the Player is out in the Corridors and a full wall once they are inside; it only switches out of sight.
- The two rooms must look the same from inside at the moment of the Wrap, and the Start Room must look the same turned half around, so nothing inside them may depend on world position. The Safe Rooms have no Fog and no Dust (both stop at their walls) and no world-space surface variation, and every part of a Safe Room comes in pairs turned half around its center, sharing one bake.
- Furniture in a Safe Room that is not paired (the Clock Table) is the one exception to "nothing moves": it stands in the room the Player is in or entering, turned half around while they are in the House, and moves only when a Passage into a room begins with the door still shut. The Wrap then carries it back to its Start Room spot together with the Player, so its moves are never seen.
