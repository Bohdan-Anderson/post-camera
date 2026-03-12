# Vite setup

Example of using `pose-camera` in a Vite project so the worker script loads correctly.

## 1. Create a Vite app (if needed)

```bash
npm create vite@latest my-pose-app -- --template vanilla-ts
cd my-pose-app
npm install
npm install pose-camera @tensorflow-models/pose-detection @tensorflow/tfjs-core @tensorflow/tfjs-backend-webgl
```

## 2. Copy the worker into your build

The worker is a single file that must be served next to your app. Two options.

### Option A: Public folder (simplest)

Copy the worker into `public/` so Vite serves it as-is:

```bash
cp node_modules/pose-camera/dist/pose-camera-worker.js public/
```

Then init with the public URL:

```ts
const camera = createPoseCamera()
await camera.init({
  workerUrl: '/pose-camera-worker.js',
})
```

### Option B: Resolve from node_modules

Point the worker URL at the package’s built file. After build, your app is served from `dist/`, so the worker path must be valid at runtime. For development (Vite dev server), you can use:

```ts
await camera.init({
  workerUrl: new URL(
    'pose-camera/dist/pose-camera-worker.js',
    import.meta.url
  ).href,
})
```

That resolves to `node_modules/pose-camera/dist/pose-camera-worker.js` when the main script is loaded from `node_modules` (e.g. in dev). For production, either copy the worker into `public/` (Option A) or configure Vite to copy it into `dist/` (see Option C).

### Option C: Vite plugin to copy worker

In `vite.config.ts`:

```ts
import { defineConfig } from 'vite'
import path from 'path'
import fs from 'fs'

export default defineConfig({
  plugins: [
    {
      name: 'copy-pose-camera-worker',
      writeBundle() {
        const src = path.resolve(
          process.cwd(),
          'node_modules/pose-camera/dist/pose-camera-worker.js'
        )
        const dest = path.resolve(process.cwd(), 'dist/pose-camera-worker.js')
        fs.copyFileSync(src, dest)
      },
    },
  ],
})
```

Then use:

```ts
await camera.init({
  workerUrl: new URL('./pose-camera-worker.js', import.meta.url).href,
})
```

After `vite build`, `dist/pose-camera-worker.js` will exist and the URL will work.

## 3. Minimal app example

**index.html**

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Pose Camera</title>
  </head>
  <body>
    <video id="camera" autoplay playsinline muted width="640" height="480"></video>
    <pre id="status">Initializing…</pre>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
```

**src/main.ts**

```ts
import { createPoseCamera } from 'pose-camera'

const video = document.getElementById('camera') as HTMLVideoElement
const statusEl = document.getElementById('status')!

const camera = createPoseCamera()
camera.setVideoElement(video)

camera.onStatusChange((status) => {
  statusEl.textContent = JSON.stringify(status, null, 2)
})

camera.onFrame((users, options) => {
  if (users.length > 0) {
    const { pose } = users[0]
    const nose = pose.keypoints.find((k) => k.name === 'nose')
    if (nose) statusEl.textContent = `Nose: ${nose.x.toFixed(0)}, ${nose.y.toFixed(0)}`
  }
})

async function main() {
  await camera.init({
    workerUrl: '/pose-camera-worker.js', // if using public/
    // or: workerUrl: new URL('pose-camera/dist/pose-camera-worker.js', import.meta.url).href,
  })
  const cameras = await camera.getAvailableCameras()
  if (cameras.length === 0) {
    statusEl.textContent = 'No cameras found'
    return
  }
  await camera.selectCamera(cameras[0].deviceId)
  camera.startTracking()
}

main().catch((err) => {
  statusEl.textContent = `Error: ${err.message}`
})
```

Run with `npm run dev`; ensure the worker URL is reachable (e.g. file in `public/` or correct path to `node_modules/pose-camera/dist/pose-camera-worker.js`).

## 4. Vue / React

Same idea: install deps, copy or expose the worker, then call `createPoseCamera()`, `setVideoElement()`, `init({ workerUrl })`, `selectCamera()`, `startTracking()` (e.g. in `onMounted` / `useEffect`). Call `dispose()` in `onBeforeUnmount` / cleanup.
