import type { Pose } from '@tensorflow-models/pose-detection'
import type { Status } from './status.js'

/**
 * Frame dimensions passed with each pose callback.
 */
export interface FrameOptions {
  width: number
  height: number
}

/**
 * One user's pose plus optional index/id.
 */
export interface UserFrame {
  pose: Pose
  index: number
}

/**
 * Options for init() – model and worker.
 */
export interface InitOptions {
  maxPoses?: number
  /** URL to the worker script. If not set, uses default relative to main script. */
  workerUrl?: string
}

/**
 * Options for start() – convenience flow.
 */
export interface StartOptions extends InitOptions {
  deviceId?: string
  constraints?: MediaTrackConstraints
}

/**
 * Public API of the pose camera instance.
 */
export interface PoseCameraAPI {
  get status(): Status
  setVideoElement(element: HTMLVideoElement | null): void
  onFrame(cb: (users: UserFrame[], options: FrameOptions) => void): () => void
  onStatusChange(cb: (status: Status) => void): () => void
  init(options?: InitOptions): Promise<void>
  getAvailableCameras(): Promise<MediaDeviceInfo[]>
  selectCamera(deviceId: string, constraints?: MediaTrackConstraints): Promise<void>
  startTracking(): void
  stopTracking(): void
  dispose(): void
  start(options?: StartOptions): Promise<void>
  readonly utils: PoseCameraUtils
}

/**
 * Utility functions exposed on the API.
 */
export interface PoseCameraUtils {
  getRelativeToShoulders(
    pose: Pose,
    options: FrameOptions,
  ): RelativeShoulderResult
  getAvailableMedia(): Promise<MediaDeviceInfo[]>
  getMediaPermission(): Promise<Status['mediaPermission']>
  avgBetween(a: { x: number; y: number }, b: { x: number; y: number }): { x: number; y: number }
  distanceBetween(
    a: { x: number; y: number },
    b: { x: number; y: number },
    options: FrameOptions,
  ): number
}

/**
 * One keypoint with x,y relative to shoulder center (normalized by frame size).
 */
export interface RelativeKeypoint {
  x: number
  y: number
  score: number
  name?: string
}

/**
 * Result of getRelativeToShoulders – center (canvas-relative), all keypoints relative to center, body height.
 */
export interface RelativeShoulderResult {
  /** Shoulder center in canvas-relative coords (0–1). */
  center: { x: number; y: number }
  /** Same structure as Pose.keypoints; x,y are relative to center (normalized by frame width/height). */
  keypoints: RelativeKeypoint[]
  /** Distance from shoulder center to hip center as fraction of frame size. */
  bodyHeight: number | null
}

export type { Pose }
export type { Status }
