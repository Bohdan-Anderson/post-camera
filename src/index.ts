import { createPoseCamera } from './create.js'
export { createPoseCamera }
export type {
  PoseCameraAPI,
  Status,
  FrameOptions,
  UserFrame,
  InitOptions,
  StartOptions,
  FaceSnapshotOptions,
  FaceSnapshot,
  PoseCameraUtils,
  RelativeShoulderResult,
  RelativeKeypoint,
  Pose,
} from './types/api.js'

declare global {
  interface Window {
    PoseCamera?: typeof createPoseCamera
  }
}

if (typeof window !== 'undefined') {
  window.PoseCamera = createPoseCamera
}
