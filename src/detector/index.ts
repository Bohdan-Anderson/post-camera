import { loadModel } from './load.js'
import { startTracking, stopTracking } from './loop.js'
import {
  addFrameCallback,
  terminateWorker,
  isWorkerReady,
} from './bridge.js'

export async function init(options?: import('../types/api.js').InitOptions): Promise<void> {
  await loadModel(options)
}

export { startTracking, stopTracking }

export function dispose(): void {
  terminateWorker()
}

export function getDetectorReady(): boolean {
  return isWorkerReady()
}

export { addFrameCallback }
