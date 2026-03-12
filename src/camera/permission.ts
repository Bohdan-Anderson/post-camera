export type MediaPermission = 'granted' | 'denied' | 'prompt' | 'unsupported'

/**
 * Query camera permission state. Returns 'unsupported' when Permissions API is not available (e.g. Safari).
 */
export async function getMediaPermission(): Promise<MediaPermission> {
  if (!navigator.permissions?.query) return 'unsupported'
  try {
    const result = await navigator.permissions.query({ name: 'camera' as PermissionName })
    return result.state as MediaPermission
  } catch {
    return 'unsupported'
  }
}
