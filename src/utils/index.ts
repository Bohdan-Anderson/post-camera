import type { Pose } from '@tensorflow-models/pose-detection'
import type { FrameOptions, PoseCameraUtils } from '../types/api.js'
import { getRelativeToShoulders } from './relative.js'
import { avgBetween, distanceBetween as distBetween } from './geometry.js'
import { getAvailableCamerasWithPermission, getMediaPermission } from '../camera/index.js'

export { getRelativeToShoulders } from './relative.js'
export { avgBetween, distanceBetween } from './geometry.js'
export { KEYPOINT_NAMES } from './keypoints.js'

export function createUtils(): PoseCameraUtils {
  return {
    getRelativeToShoulders(pose: Pose, options: FrameOptions) {
      return getRelativeToShoulders(pose, options)
    },
    getAvailableMedia: getAvailableCamerasWithPermission,
    getMediaPermission,
    avgBetween,
    distanceBetween(a, b, options) {
      return distBetween(a, b, options)
    },
  }
}
