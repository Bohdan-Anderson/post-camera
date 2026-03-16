import { setStatus } from '../state/store.js'
import { createWorker } from './bridge.js'
import type { InitOptions } from '../types/api.js'

/**
 * Resolve worker script URL. Use options.workerUrl if provided; otherwise default relative to main script (ESM only; CJS must pass workerUrl).
 */
export function getWorkerUrl(options?: InitOptions): string | undefined {
  if (options?.workerUrl) return options.workerUrl
  if (typeof import.meta !== 'undefined' && import.meta.url) {
    return new URL('pose-camera-worker.js', import.meta.url).href
  }
  return undefined
}

export async function loadModel(options?: InitOptions): Promise<void> {
  setStatus({ modelStatus: 'loading', error: null })
  const url = getWorkerUrl(options)
  if (!url) {
    const msg =
      'workerUrl is required when using CommonJS. Pass init({ workerUrl }) or use ESM; see README.'
    setStatus({ modelStatus: 'error', error: msg })
    throw new Error(msg)
  }
  try {
    await createWorker(url, {
      maxPoses: options?.maxPoses ?? 1,
      enableSmoothing: options?.enableSmoothing ?? false,
      modelType: options?.modelType ?? 'lite',
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to load model'
    setStatus({ modelStatus: 'error', error: msg })
    throw err
  }
}
