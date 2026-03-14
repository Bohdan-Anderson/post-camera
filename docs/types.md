# Types guide

All public types are exported from `pose-camera`. Use them for props, state, and callbacks.

## Importing types

```ts
import type {
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
} from 'pose-camera'
```

---

## Status

```ts
interface Status {
  cameraReady: boolean
  tracking: boolean
  trackedUserCount: number
  modelStatus: 'idle' | 'loading' | 'ready' | 'error'
  mediaPermission: 'granted' | 'denied' | 'prompt' | 'unsupported'
  error: string | null
}
```

Use for UI (loading, errors, permission), e.g. with `onStatusChange` or reading `camera.status`.

---

## FrameOptions

```ts
interface FrameOptions {
  width: number   // video frame width
  height: number  // video frame height
}
```

Passed to `onFrame(users, options)` and to `utils.getRelativeToShoulders(pose, options)` so coordinates can be normalized.

---

## UserFrame

```ts
interface UserFrame {
  pose: Pose   // from @tensorflow-models/pose-detection
  index: number
}
```

Each element in the `users` array in `onFrame`. `index` is the user index in that frame (0 to maxPoses-1).

---

## Pose

Re-exported from `@tensorflow-models/pose-detection`. MoveNet pose shape:

- **keypoints**: array of `{ x: number, y: number, score: number, name?: string }`
- **score**: overall pose score (0–1)

Keypoint names (indices): nose, left_eye, right_eye, left_ear, right_ear, left_shoulder, right_shoulder, left_elbow, right_elbow, left_wrist, right_wrist, left_hip, right_hip, left_knee, right_knee, left_ankle, right_ankle.

---

## InitOptions

```ts
interface InitOptions {
  maxPoses?: number           // default 1
  workerUrl?: string           // URL of pose-camera-worker.js (required in most bundler setups)
  faceSnapshots?: FaceSnapshotOptions  // enable face snapshots (128×128 crops at interval)
}
```

Passed to `init(options)` and to `start(options)`.

---

## FaceSnapshotOptions

Options for the optional face snapshot feature (crops derived from pose keypoints, resized to 128×128).

```ts
interface FaceSnapshotOptions {
  enabled: boolean      // enable periodic face snapshots (default false)
  intervalMs?: number   // milliseconds between snapshot batches (default 2000)
}
```

Use in `init({ faceSnapshots: { enabled: true, intervalMs: 2000 } })` or `setFaceSnapshotOptions({ enabled: true })`.

---

## FaceSnapshot

One face snapshot delivered to `onFaceUpdate` callbacks.

```ts
interface FaceSnapshot {
  userIndex: number   // matches UserFrame.index for that user
  imageData: ImageData  // 128×128 RGBA
  dataURL: string       // e.g. image/png data URL for <img src="...">
}
```

---

## StartOptions

```ts
interface StartOptions extends InitOptions {
  deviceId?: string
  constraints?: MediaTrackConstraints
}
```

Passed to `start(options)`. Includes init options plus optional camera selection.

---

## PoseCameraAPI

The type of the object returned by `createPoseCamera()`. Use when you need to type a variable or a ref:

```ts
import type { PoseCameraAPI } from 'pose-camera'

let camera: PoseCameraAPI
camera = createPoseCamera()
```

---

## PoseCameraUtils

Type of `camera.utils`:

```ts
interface PoseCameraUtils {
  getRelativeToShoulders(pose: Pose, options: FrameOptions): RelativeShoulderResult
  getAvailableMedia(): Promise<MediaDeviceInfo[]>
  getMediaPermission(): Promise<Status['mediaPermission']>
  avgBetween(a: { x: number; y: number }, b: { x: number; y: number }): { x: number; y: number }
  distanceBetween(
    a: { x: number; y: number },
    b: { x: number; y: number },
    options: FrameOptions,
  ): number
}
```

---

## RelativeKeypoint

One keypoint with coordinates relative to the shoulder center (normalized by frame size). Same fields as a MoveNet keypoint; `x` and `y` are offsets from center.

```ts
interface RelativeKeypoint {
  x: number
  y: number
  score: number
  name?: string
}
```

---

## RelativeShoulderResult

Return type of `utils.getRelativeToShoulders(pose, options)`:

```ts
interface RelativeShoulderResult {
  /** Shoulder center in canvas-relative coords (0–1). */
  center: { x: number; y: number }
  /** Same structure as Pose.keypoints; x,y are relative to center (normalized by frame). */
  keypoints: RelativeKeypoint[]
  /** Distance from shoulder center to hip center as fraction of frame size. */
  bodyHeight: number | null
}
```

Use for input that is independent of resolution (e.g. gestures relative to body). All keypoints keep the same order and names as the original pose.

---

## Example: typing a React/Vue callback

```ts
import type { UserFrame, FrameOptions } from 'pose-camera'

function handleFrame(users: UserFrame[], options: FrameOptions) {
  users.forEach(({ pose }) => {
    const nose = pose.keypoints.find((k) => k.name === 'nose')
    if (nose && nose.score > 0.5) {
      // use nose.x, nose.y
    }
  })
}

camera.onFrame(handleFrame)
```
