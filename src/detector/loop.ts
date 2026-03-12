import { startLoop, stopLoop } from './bridge.js'

export function startTracking(): void {
  startLoop()
}

export function stopTracking(): void {
  stopLoop()
}
