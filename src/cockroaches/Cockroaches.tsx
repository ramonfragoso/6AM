import type { Kit } from "@/kit/useKit"
import { useCockroaches } from "./useCockroaches"

export function Cockroaches({ kit }: { kit: Kit }) {
  const mesh = useCockroaches(kit)
  return <primitive object={mesh} />
}
