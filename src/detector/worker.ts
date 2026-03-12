/**
 * Worker entry: loads TF + detector, receives frame data, runs estimatePoses, posts poses back.
 * Bundled as a separate IIFE so the main bundle can load it via new Worker(url).
 */
import '@tensorflow/tfjs-backend-webgl'
import * as tf from '@tensorflow/tfjs-core'
import * as poseDetection from '@tensorflow-models/pose-detection'

type WorkerInitMessage = { type: 'init'; maxPoses?: number }
type WorkerFrameMessage = {
  type: 'frame'
  imageData: ImageData
  width: number
  height: number
}
type WorkerMessage = WorkerInitMessage | WorkerFrameMessage

let detector: poseDetection.PoseDetector | null = null
let maxPoses = 1

async function loadModel(): Promise<void> {
  if (detector) return
  await tf.setBackend('webgl')
  const modelType: poseDetection.MoveNetModelConfig['modelType'] =
    poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING
  detector = await poseDetection.createDetector(
    poseDetection.SupportedModels.MoveNet,
    { modelType, enableSmoothing: true, enableTracking: true },
  )
}

async function handleFrame(imageData: ImageData, width: number, height: number): Promise<void> {
  if (!detector) return
  const canvas = new OffscreenCanvas(width, height)
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  ctx.putImageData(imageData, 0, 0)
  const poses = await detector.estimatePoses(canvas as unknown as HTMLVideoElement, {
    flipHorizontal: false,
    maxPoses,
  })
  self.postMessage({ type: 'poses', poses, width, height })
}

self.onmessage = async (e: MessageEvent<WorkerMessage>) => {
  const msg = e.data
  if (msg.type === 'init') {
    try {
      maxPoses = msg.maxPoses ?? 1
      await loadModel()
      self.postMessage({ type: 'ready' })
    } catch (err) {
      self.postMessage({
        type: 'error',
        message: err instanceof Error ? err.message : String(err),
      })
    }
    return
  }
  if (msg.type === 'frame') {
    await handleFrame(msg.imageData, msg.width, msg.height)
  }
}
