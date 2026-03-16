# pose-camera

Plug-and-play camera and pose detection for the browser. Uses a **Web Worker** for pose detection so the main thread stays responsive.

## Install

```bash
npm install pose-camera @tensorflow-models/pose-detection @tensorflow/tfjs-core @tensorflow/tfjs-backend-webgl
```

Peer dependencies: `@tensorflow-models/pose-detection`, `@tensorflow/tfjs-core`, `@tensorflow/tfjs-backend-webgl`.

## Usage

```js
import { createPoseCamera } from 'pose-camera'

const camera = createPoseCamera()

// Optional: set which <video> shows the camera
camera.setVideoElement(document.querySelector('video'))

// Callbacks
camera.onFrame((users, options) => {
  console.log(users.length, 'user(s)', options.width, options.height)
})
camera.onStatusChange((status) => {
  console.log('status', status.cameraReady, status.tracking, status.modelStatus)
})

// Optional: enable face snapshots (128×128 crops every few seconds)
await camera.init({
  faceSnapshots: { enabled: true, intervalMs: 2000 },
})
const cameras = await camera.getAvailableCameras()
if (cameras.length) {
  await camera.selectCamera(cameras[0].deviceId)
  camera.startTracking()
}

// Or one-shot
await camera.start()
```

## How it works

- **Main thread**: Camera, video element, your callbacks (`onFrame`, `onStatusChange`), and frame capture. No TensorFlow on the main thread.
- **Web Worker**: TensorFlow and the pose model run in a dedicated worker. Frames are sent as `ImageData`; poses are posted back. The **API you use is the same** – no worker-specific code.

The worker script is loaded from `pose-camera-worker.js` next to the main script. With a **bundler** (Vite, Webpack, etc.), you may need to pass the worker URL so it resolves correctly:

```js
await camera.init({
  workerUrl: new URL('pose-camera/dist/pose-camera-worker.js', import.meta.url).href
})
```

Or configure your bundler to expose the worker (e.g. Vite’s `?worker` or copying `node_modules/pose-camera/dist/pose-camera-worker.js` into your build).

## API

- **status**: `{ cameraReady, tracking, trackedUserCount, modelStatus, mediaPermission, error }`
- **setVideoElement(element)**: Set the `<video>` that shows the camera feed.
- **onFrame(cb)**, **onStatusChange(cb)**: Subscribe; return unsubscribe.
- **onFaceUpdate(cb)**: Subscribe to face snapshots (when `faceSnapshots.enabled`). Callback receives `FaceSnapshot[]` (128×128 face crops); return unsubscribe.
- **setFaceSnapshotOptions(options)**: Enable/disable face snapshots at runtime; options: `{ enabled, intervalMs? }`.
- **init(options?)**: Load model (worker). Options: `maxPoses`, `workerUrl`, `faceSnapshots` (`{ enabled, intervalMs? }`), `enableSmoothing` (default `false`), `modelType` (`'lite'` | `'full'`, default `'lite'`).
- **getAvailableCameras()**: List video input devices.
- **selectCamera(deviceId, constraints?)**: Start stream and attach to video element.
- **startTracking()** / **stopTracking()**: Start or stop the detection loop.
- **dispose()**: Stop tracking, stop camera, reset state.
- **start(options?)**: Init, optionally select camera, then start tracking.
- **utils**: `getRelativeToShoulders(pose, options)` (center + all keypoints relative to center + body height), `getAvailableMedia()`, `getMediaPermission()`, `avgBetween`, `distanceBetween`.

## Documentation

- **[Quick start](docs/quick-start.md)** — Get running in a few steps.
- **[Vite setup](docs/vite-setup.md)** — Example Vite project and worker URL options.
- **[API reference](docs/api.md)** — Full method and option details.
- **[Types guide](docs/types.md)** — TypeScript types and usage.

## Types

TypeScript types are exported: `PoseCameraAPI`, `Status`, `FrameOptions`, `UserFrame`, `InitOptions`, `StartOptions`, `FaceSnapshotOptions`, `FaceSnapshot`, `Pose` (from pose-detection), `DetectorModelType`.

## Global

In the browser, `window.PoseCamera` is set to the factory: `window.PoseCamera()` returns a new API instance.
