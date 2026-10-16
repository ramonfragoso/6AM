type Listener<Event> = (event: Event) => void

export function eventChannel<Event>() {
  const listeners = new Set<Listener<Event>>()

  return {
    emit(event: Event) {
      for (const listener of listeners) listener(event)
    },
    listen(listener: Listener<Event>) {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
  }
}
