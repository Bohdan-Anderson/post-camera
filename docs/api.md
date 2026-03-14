# API reference

## createPoseCamera()

Creates a new pose camera instance. Each instance has its own state, worker, and callbacks.

```ts
const camera = createPoseCamera()
```

---

## Instance API

### status (getter)

Current state. Read-only; subscribe to changes with `onStatusChange`.

| Field               | Type                                                                 | Description                                      |
|---------------------|----------------------------------------------------------------------|--------------------------------------------------|
| `cameraReady`       | `boolean`                                                            | Camera stream is attached and active             |
| `tracking`          | `boolean`                                                            | Detection loop is running                        |
| `trackedUserCount`  | `number`                                                             | Number of poses in the last frame (0 to maxPoses)|
| `modelStatus`       | `'idle' \| 'loading' \| 'ready' \| 'error'`                         | Worker/model state                               |
| `mediaPermission`   | `'granted' \| 'denied' \| 'prompt' \| 'unsupported'`                | Camera permission (unsupported in some browsers) |
| `error`             | `string \| null`                                                     | Last error message                               |

---

### setVideoElement(element)

Sets the `<video>` element that shows the camera feed and is used for frame capture. Call before `selectCamera` or `start()` if you want a preview.

- **element**: `HTMLVideoElement | null` — pass `null` to clear.

---

### onFrame(callback)

Subscribe to pose results each frame. Returns an unsubscribe function.

- **callback**: `(users: UserFrame[], options: FrameOptions) => void`
  - **users**: Array of detected poses; each has `pose` (MoveNet pose) and `index`.
  - **options**: `{ width, height }` of the video frame.

```ts
const unsubscribe = camera.onFrame((users, options) => {
  users.forEach(({ pose, index }) => {
    console.log('User', index, pose.keypoints)
  })
})
// later: unsubscribe()
```

---

### onFaceUpdate(callback)

Subscribe to live face snapshots. Only emits when **face snapshots are enabled** (via `init({ faceSnapshots: { enabled: true } })` or `setFaceSnapshotOptions({ enabled: true })`). Returns an unsubscribe function.

Faces are derived from pose keypoints (nose, eyes, ears): the library crops that region from the video frame and fits it into **128×128** with aspect ratio preserved (no stretch). You receive an array of snapshots, one per detected user, at the configured interval. When the crop is not square, the 128×128 image may contain transparent letterbox/pillarbox areas.

- **callback**: `(faces: FaceSnapshot[]) => void`
  - Each **FaceSnapshot** has: `userIndex` (matches `UserFrame.index`), `imageData` (128×128 RGBA), and `dataURL` (e.g. for `<img src="...">`).

```ts
const unsub = camera.onFaceUpdate((faces) => {
  faces.forEach((face) => {
    console.log('User', face.userIndex)
    imgElement.src = face.dataURL  // display 128×128 face crop
  })
})
// Toggle on (e.g. at init or later):
camera.setFaceSnapshotOptions({ enabled: true, intervalMs: 2000 })
// Toggle off:
camera.setFaceSnapshotOptions({ enabled: false })
unsub()
```

---

### setFaceSnapshotOptions(options)

Enable or disable face snapshots at runtime and optionally set the interval. No need to call `init()` again.

- **options**: `FaceSnapshotOptions`
  - **enabled**: `boolean` — turn face snapshots on or off.
  - **intervalMs**: `number` (optional) — milliseconds between snapshot batches (default `2000`).

```ts
camera.setFaceSnapshotOptions({ enabled: true, intervalMs: 3000 })
camera.setFaceSnapshotOptions({ enabled: false })
```

---

### onStatusChange(callback)

Subscribe to status updates. Returns an unsubscribe function.

- **callback**: `(status: Status) => void`

```ts
const unsub = camera.onStatusChange((status) => {
  if (status.modelStatus === 'ready') console.log('Model ready')
})
```

---

### init(options?)

Loads the worker and the pose model. Must be called before `startTracking()`.

- **options** (optional):
  - **maxPoses**: `number` — max poses to detect (default `1`).
  - **workerUrl**: `string` — URL of the worker script. Required in most bundler setups.
  - **faceSnapshots**: `FaceSnapshotOptions` — enable face snapshots and set interval.
    - **enabled**: `boolean` — enable periodic 128×128 face crops (default `false`).
    - **intervalMs**: `number` (optional) — milliseconds between snapshot batches (default `2000`).

```ts
await camera.init({
  maxPoses: 2,
  workerUrl: '/pose-camera-worker.js',
  faceSnapshots: { enabled: true, intervalMs: 2000 },
})
```

---

### getAvailableCameras()

Returns a list of video input devices. Requests permission first so labels are available when possible.

```ts
const devices = await camera.getAvailableCameras()
// devices: MediaDeviceInfo[] (deviceId, label, kind, groupId)
```

---

### selectCamera(deviceId, constraints?)

Starts the camera stream and attaches it to the current video element (if set).

- **deviceId**: `string` — from `getAvailableCameras()`.
- **constraints**: optional `MediaTrackConstraints` (e.g. `{ width: { ideal: 1280 }, height: { ideal: 720 } }`).

```ts
await camera.selectCamera(devices[0].deviceId, {
  width: { ideal: 1280 },
  height: { ideal: 720 },
})
```

---

### startTracking()

Starts the detection loop. Requires `modelStatus === 'ready'` and an active camera (video element with stream). Frames are captured and sent to the worker; results are delivered via `onFrame`.

---

### stopTracking()

Stops the detection loop. Does not stop the camera stream.

---

### dispose()

Full teardown: stops tracking, terminates the worker, stops the camera stream, and resets status. Call when unmounting or when you are done with the instance.

---

### start(options?)

Convenience: runs `init(options)`, then optionally selects a camera (if `options.deviceId` or first available), then `startTracking()` if the stream is active.

- **options**: optional `StartOptions` (extends `InitOptions` with `deviceId?`, `constraints?`).

```ts
await camera.start({
  workerUrl: '/pose-camera-worker.js',
  deviceId: savedDeviceId,
  constraints: { width: { ideal: 640 }, height: { ideal: 480 } },
})
```

---

### utils

Object of helper functions:

| Method                    | Description |
|---------------------------|-------------|
| `getRelativeToShoulders(pose, options)` | Center (shoulder midpoint, canvas 0–1), all keypoints relative to center (same structure as pose), and body height. |
| `getAvailableMedia()`     | Same as `getAvailableCameras()`. |
| `getMediaPermission()`     | Camera permission state. |
| `avgBetween(a, b)`        | Average of two `{ x, y }` points. |
| `distanceBetween(a, b, options)` | Distance as fraction of frame size. |

```ts
camera.onFrame((users, options) => {
  if (users.length) {
    const rel = camera.utils.getRelativeToShoulders(users[0].pose, options)
    console.log(rel.center)       // { x, y } canvas-relative (0–1)
    console.log(rel.keypoints)   // same structure as pose.keypoints, x,y relative to center
    console.log(rel.bodyHeight) // fraction of frame
  }
})
```

---

## Global (browser only)

When running in a browser, `window.PoseCamera` is set to the factory:

```ts
const camera = window.PoseCamera!()
```

Same as `createPoseCamera()`.
