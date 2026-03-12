import { setStatus } from '../state/store.js'
import { getVideoElement, setVideoElement } from './element.js'
import { startStream, stopStream, isStreamActive, getStream } from './stream.js'
import { getAvailableCamerasWithPermission } from './devices.js'
import { getMediaPermission } from './permission.js'

export { getVideoElement, setVideoElement }
export { getAvailableCamerasWithPermission }
export { getMediaPermission }

export async function selectCamera(
  deviceId: string,
  constraints?: MediaTrackConstraints,
): Promise<void> {
  try {
    setStatus({ error: null })
    await startStream(deviceId, constraints)
    setStatus({ cameraReady: isStreamActive() })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to start camera'
    setStatus({ cameraReady: false, error: msg })
    throw err
  }
}

export function stopCamera(): void {
  stopStream()
  setStatus({ cameraReady: false, error: null })
}

export { isStreamActive, getStream }
