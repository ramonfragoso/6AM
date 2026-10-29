import { newCockroaches } from "@/cockroaches/cockroachWalk"
import { nightClock } from "@/night/nightClock"
import type { Haunt } from "./haunts"
import { reachedCorner } from "./triggers"

export const COCKROACHES: Haunt = {
  id: "cockroaches",
  name: "Cockroaches",
  kind: "loud",
  trigger: reachedCorner,
  haunt: (state, { sinceManifest }) => {
    state.cockroaches ??= newCockroaches(nightClock() - sinceManifest, Math.random())
  },
}
