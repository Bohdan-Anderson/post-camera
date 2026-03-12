/**
 * Enumerate video input devices. Call after permission is granted for labels.
 */
export async function getAvailableCameras(): Promise<MediaDeviceInfo[]> {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices()
    return devices.filter((d) => d.kind === 'videoinput')
  } catch {
    return []
  }
}

/**
 * Request permission and enumerate; use when labels are needed.
 */
export async function getAvailableCamerasWithPermission(): Promise<MediaDeviceInfo[]> {
  try {
    await navigator.mediaDevices.getUserMedia({ video: true })
  } catch {
    // permission denied or not available
  }
  return getAvailableCameras()
}
