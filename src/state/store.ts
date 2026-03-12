import type { Status } from '../types/status.js'
import { createInitialStatus } from './initial.js'

type Listener = (status: Status) => void

let status: Status = createInitialStatus()
const listeners: Listener[] = []

export function getStatus(): Status {
  return { ...status }
}

export function setStatus(partial: Partial<Status>): void {
  status = { ...status, ...partial }
  notify()
}

export function subscribe(cb: Listener): () => void {
  listeners.push(cb)
  return () => {
    const i = listeners.indexOf(cb)
    if (i !== -1) listeners.splice(i, 1)
  }
}

function notify(): void {
  const snapshot = getStatus()
  listeners.forEach((cb) => cb(snapshot))
}

export function resetStatus(): void {
  status = createInitialStatus()
}
