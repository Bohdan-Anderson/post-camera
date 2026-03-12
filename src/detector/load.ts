import { setStatus } from '../state/store.js'
import { createWorker } from './bridge.js'
import type { InitOptions } from '../types/api.js'

/**
 * Resolve worker script URL. Use options.workerUrl if provided; otherwise default relative to main script.
 */
export function getWorkerUrl(options?: InitOptions): string {
  if (options?.workerUrl) return options.workerUrl
  return new URL('pose-camera-worker.js', import.meta.url).href
}

export async function loadModel(options?: InitOptions): Promise<void> {
  setStatus({ modelStatus: 'loading', error: null })
  const url = getWorkerUrl(options)
  try {
    await createWorker(url, options?.maxPoses ?? 1)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to load model'
    setStatus({ modelStatus: 'error', error: msg })
    throw err
  }
}
