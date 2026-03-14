# Quick Start

Get pose detection running in a few steps.

## 1. Install

```bash
npm install pose-camera @tensorflow-models/pose-detection @tensorflow/tfjs-core @tensorflow/tfjs-backend-webgl
```

## 2. Add a video element

In your HTML (or template):

```html
<video id="camera" autoplay playsinline muted></video>
```

## 3. Create the camera and start

```js
import { createPoseCamera } from 'pose-camera'

const camera = createPoseCamera()
camera.setVideoElement(document.getElementById('camera'))

camera.onFrame((users, options) => {
  if (users.length > 0) {
    console.log('Detected', users.length, 'user(s)')
    const pose = users[0].pose
    // pose.keypoints: array of { x, y, score, name }
  }
})

await camera.init()
const cameras = await camera.getAvailableCameras()
if (cameras.length) {
  await camera.selectCamera(cameras[0].deviceId)
  camera.startTracking()
}
```

## 4. Using a bundler (Vite, etc.)

Pass the worker URL so the library can load the pose-detection worker:

```js
await camera.init({
  workerUrl: new URL('pose-camera/dist/pose-camera-worker.js', import.meta.url).href,
})
```

See [Vite setup](./vite-setup.md) for a full example.

## 5. Face snapshots (optional)

To get periodic 128×128 face crops from the video (derived from pose keypoints), enable face snapshots and subscribe. The image preserves the face crop’s aspect ratio and may have transparent areas when the crop is not square.

```js
await camera.init({
  workerUrl: new URL('pose-camera/dist/pose-camera-worker.js', import.meta.url).href,
  faceSnapshots: { enabled: true, intervalMs: 2000 },
})
const unsub = camera.onFaceUpdate((faces) => {
  faces.forEach((face) => {
    document.getElementById('face-img').src = face.dataURL  // 128×128 face crop
  })
})
// Toggle off anytime: camera.setFaceSnapshotOptions({ enabled: false })
```

See [API reference](./api.md#onfaceupdatecallback) for details.

## 6. One-shot convenience

To init, pick a camera, and start tracking in one call:

```js
await camera.start()
```

You still need to call `setVideoElement` before `start()` if you want the preview on a specific `<video>`.

## 7. Cleanup

When leaving the page or tearing down:

```js
camera.dispose()
```

This stops tracking, stops the camera, and resets state.
