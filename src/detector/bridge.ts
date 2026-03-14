import { getStatus, setStatus } from '../state/store.js'
import { getVideoElement } from '../camera/element.js'
import { processFaces } from '../face/snapshots.js'
import type { UserFrame } from '../types/api.js'

const frameCallbacks: ((users: UserFrame[], options: { width: number; height: number }) => void)[] = []
let worker: Worker | null = null
let rafId: number | null = null
let captureCanvas: HTMLCanvasElement | null = null
let captureCtx: CanvasRenderingContext2D | null = null

export function setFrameCallbacks(cbs: typeof frameCallbacks): void {
  frameCallbacks.length = 0
  frameCallbacks.push(...cbs)
}

export function addFrameCallback(cb: (users: UserFrame[], options: { width: number; height: number }) => void): () => void {
  frameCallbacks.push(cb)
  return () => {
    const i = frameCallbacks.indexOf(cb)
    if (i !== -1) frameCallbacks.splice(i, 1)
  }
}

export function createWorker(workerUrl: string, maxPoses?: number): Promise<void> {
  return new Promise((resolve, reject) => {
    if (worker) {
      resolve()
      return
    }
    try {
      worker = new Worker(workerUrl)
      worker.onmessage = (e: MessageEvent<{ type: string; poses?: unknown[]; width?: number; height?: number; message?: string }>) => {
        const d = e.data
        if (d.type === 'ready') {
          setStatus({ modelStatus: 'ready', error: null })
          resolve()
        } else if (d.type === 'error') {
          setStatus({ modelStatus: 'error', error: d.message ?? 'Worker error' })
          reject(new Error(d.message))
        } else if (d.type === 'poses' && d.poses && d.width != null && d.height != null) {
          const users: UserFrame[] = (d.poses as import('@tensorflow-models/pose-detection').Pose[]).map(
            (pose, index) => ({ pose, index }),
          )
          setStatus({ trackedUserCount: users.length, tracking: true })
          frameCallbacks.forEach((cb) => cb(users, { width: d.width!, height: d.height! }))
          processFaces(users, d.width, d.height)
        }
      }
      worker.onerror = () => {
        setStatus({ modelStatus: 'error', error: 'Worker failed to load' })
        reject(new Error('Worker failed to load'))
      }
      worker.postMessage({ type: 'init', maxPoses })
    } catch (err) {
      reject(err)
    }
  })
}

export function captureAndPostFrame(): void {
  const video = getVideoElement()
  if (!video || video.readyState < 2 || !worker) return
  const w = video.videoWidth
  const h = video.videoHeight
  if (w === 0 || h === 0) return
  if (!captureCanvas) {
    captureCanvas = document.createElement('canvas')
    captureCtx = captureCanvas.getContext('2d')
  }
  if (!captureCanvas || !captureCtx) return
  captureCanvas.width = w
  captureCanvas.height = h
  captureCtx.drawImage(video, 0, 0)
  const imageData = captureCtx.getImageData(0, 0, w, h)
  worker.postMessage({ type: 'frame', imageData, width: w, height: h })
}

export function startLoop(): void {
  if (rafId != null) return
  function tick(): void {
    rafId = requestAnimationFrame(tick)
    captureAndPostFrame()
  }
  rafId = requestAnimationFrame(tick)
  setStatus({ tracking: true })
}

export function stopLoop(): void {
  if (rafId != null) {
    cancelAnimationFrame(rafId)
    rafId = null
  }
  setStatus({ tracking: false, trackedUserCount: 0 })
}

export function terminateWorker(): void {
  stopLoop()
  if (worker) {
    worker.terminate()
    worker = null
  }
  captureCanvas = null
  captureCtx = null
}

export function isWorkerReady(): boolean {
  return worker != null && getStatus().modelStatus === 'ready'
}
