import { getStatus, setStatus } from '../state/store.js'
import { getVideoElement } from '../camera/element.js'
import { processFaces } from '../face/snapshots.js'
import type { UserFrame } from '../types/api.js'

const SKIP_THRESHOLD = 4
const RECOVERY_SENDS = 16

const frameCallbacks: ((users: UserFrame[], options: { width: number; height: number }) => void)[] = []
let worker: Worker | null = null
let rafId: number | null = null
let captureCanvas: HTMLCanvasElement | null = null
let captureCtx: CanvasRenderingContext2D | null = null

let workerBusy = false
let consecutiveSkips = 0
let halfFramerateMode = false
let tickCount = 0
let sendsWithoutSkip = 0

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

/**
 * Payload sent to the worker on init. Defaults are applied by the caller (load.ts).
 */
export interface WorkerInitPayload {
  maxPoses: number
  enableSmoothing: boolean
  modelType: 'lite' | 'full'
}

export function createWorker(workerUrl: string, initPayload: WorkerInitPayload): Promise<void> {
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
          workerBusy = false
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
      worker.postMessage({
        type: 'init',
        maxPoses: initPayload.maxPoses,
        enableSmoothing: initPayload.enableSmoothing,
        modelType: initPayload.modelType,
      })
    } catch (err) {
      reject(err)
    }
  })
}

export function captureAndPostFrame(): void {
  if (!worker) return
  if (workerBusy) {
    consecutiveSkips++
    if (consecutiveSkips >= SKIP_THRESHOLD) {
      halfFramerateMode = true
      sendsWithoutSkip = 0
    }
    return
  }
  const video = getVideoElement()
  if (!video || video.readyState < 2) return
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
  const data = imageData.data
  const len = w * h
  const rgb = new Uint8Array(len * 3)
  for (let i = 0; i < len; i++) {
    const i4 = i * 4
    const i3 = i * 3
    rgb[i3] = data[i4]
    rgb[i3 + 1] = data[i4 + 1]
    rgb[i3 + 2] = data[i4 + 2]
  }
  consecutiveSkips = 0
  if (halfFramerateMode) {
    sendsWithoutSkip++
    if (sendsWithoutSkip >= RECOVERY_SENDS) {
      halfFramerateMode = false
      sendsWithoutSkip = 0
    }
  }
  workerBusy = true
  worker.postMessage({ type: 'frame', rgb, width: w, height: h }, [rgb.buffer])
}

export function startLoop(): void {
  if (rafId != null) return
  function tick(): void {
    rafId = requestAnimationFrame(tick)
    tickCount++
    if (halfFramerateMode && tickCount % 2 !== 0) return
    captureAndPostFrame()
  }
  rafId = requestAnimationFrame(tick)
  setStatus({ tracking: true })
}

function resetLoopState(): void {
  workerBusy = false
  consecutiveSkips = 0
  halfFramerateMode = false
  tickCount = 0
  sendsWithoutSkip = 0
}

export function stopLoop(): void {
  if (rafId != null) {
    cancelAnimationFrame(rafId)
    rafId = null
  }
  resetLoopState()
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
