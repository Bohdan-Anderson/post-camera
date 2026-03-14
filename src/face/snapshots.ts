import { getVideoElement } from '../camera/element.js'
import { getFaceBox } from '../utils/faceBox.js'
import type { FaceSnapshot, FaceSnapshotOptions, UserFrame } from '../types/api.js'

const FACE_SIZE = 128
const DEFAULT_INTERVAL_MS = 2000

let options: { enabled: boolean; intervalMs: number } = {
  enabled: false,
  intervalMs: DEFAULT_INTERVAL_MS,
}
let lastSnapshotTime = 0
const faceCallbacks: ((faces: FaceSnapshot[]) => void)[] = []

let faceCanvas: HTMLCanvasElement | null = null
let faceCtx: CanvasRenderingContext2D | null = null
let sourceCanvas: HTMLCanvasElement | null = null
let sourceCtx: CanvasRenderingContext2D | null = null

/**
 * Sets face snapshot options (e.g. from init). Disabled by default.
 */
export function setFaceOptions(opts: FaceSnapshotOptions | undefined): void {
  if (!opts) {
    options = { enabled: false, intervalMs: DEFAULT_INTERVAL_MS }
    return
  }
  options = {
    enabled: !!opts.enabled,
    intervalMs: opts.intervalMs ?? DEFAULT_INTERVAL_MS,
  }
}

/**
 * Subscribes to face snapshot updates. Returns unsubscribe function.
 */
export function addFaceCallback(cb: (faces: FaceSnapshot[]) => void): () => void {
  faceCallbacks.push(cb)
  return () => {
    const i = faceCallbacks.indexOf(cb)
    if (i !== -1) faceCallbacks.splice(i, 1)
  }
}

/**
 * Called from the detector when poses are available. If face snapshots are enabled,
 * interval has elapsed, and there are subscribers, captures faces from the current
 * video frame (cropped by pose keypoints) and notifies callbacks.
 */
export function processFaces(
  users: UserFrame[],
  frameWidth: number,
  frameHeight: number,
): void {
  if (!options.enabled || faceCallbacks.length === 0 || users.length === 0) return
  const now = Date.now()
  if (now - lastSnapshotTime < options.intervalMs) return
  lastSnapshotTime = now

  const video = getVideoElement()
  if (!video || video.readyState < 2) return
  const w = video.videoWidth
  const h = video.videoHeight
  if (w === 0 || h === 0) return

  if (!sourceCanvas) {
    sourceCanvas = document.createElement('canvas')
    sourceCtx = sourceCanvas.getContext('2d')
  }
  if (!faceCanvas) {
    faceCanvas = document.createElement('canvas')
    faceCanvas.width = FACE_SIZE
    faceCanvas.height = FACE_SIZE
    faceCtx = faceCanvas.getContext('2d')
  }
  if (!sourceCanvas || !sourceCtx || !faceCanvas || !faceCtx) return

  sourceCanvas.width = w
  sourceCanvas.height = h
  sourceCtx.drawImage(video, 0, 0)
  const faces: FaceSnapshot[] = []

  for (const { pose, index } of users) {
    const box = getFaceBox(pose, w, h)
    if (!box) continue
    faceCtx.clearRect(0, 0, FACE_SIZE, FACE_SIZE)
    // Preserve aspect ratio: scale so the crop fills FACE_SIZE (longer side = FACE_SIZE), center and clip; small crops upscale to 128px.
    const scale = Math.max(FACE_SIZE / box.width, FACE_SIZE / box.height)
    const dWidth = box.width * scale
    const dHeight = box.height * scale
    const dx = (FACE_SIZE - dWidth) / 2
    const dy = (FACE_SIZE - dHeight) / 2
    faceCtx.drawImage(
      sourceCanvas,
      box.x,
      box.y,
      box.width,
      box.height,
      dx,
      dy,
      dWidth,
      dHeight,
    )
    const imageData = faceCtx.getImageData(0, 0, FACE_SIZE, FACE_SIZE)
    let dataURL = ''
    try {
      dataURL = faceCanvas.toDataURL('image/png')
    } catch {
      dataURL = ''
    }
    faces.push({ userIndex: index, imageData, dataURL })
  }

  if (faces.length > 0) {
    faceCallbacks.forEach((cb) => cb(faces))
  }
}
