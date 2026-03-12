import type { Status } from '../types/status.js'

/**
 * Default status values for a new pose camera instance.
 */
export function createInitialStatus(): Status {
  return {
    cameraReady: false,
    tracking: false,
    trackedUserCount: 0,
    modelStatus: 'idle',
    mediaPermission: 'prompt',
    error: null,
  }
}
