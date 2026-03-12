/**
 * Status of the pose camera: camera, tracking, model, permission, and error.
 */
export interface Status {
  cameraReady: boolean
  tracking: boolean
  trackedUserCount: number
  modelStatus: 'idle' | 'loading' | 'ready' | 'error'
  mediaPermission: 'granted' | 'denied' | 'prompt' | 'unsupported'
  error: string | null
}
