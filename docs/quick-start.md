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

## 5. One-shot convenience

To init, pick a camera, and start tracking in one call:

```js
await camera.start()
```

You still need to call `setVideoElement` before `start()` if you want the preview on a specific `<video>`.

## Cleanup

When leaving the page or tearing down:

```js
camera.dispose()
```

This stops tracking, stops the camera, and resets state.
