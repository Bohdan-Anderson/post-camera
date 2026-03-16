/**
 * Worker entry: loads TF + detector, receives frame data, runs estimatePoses, posts poses back.
 * Bundled as a separate IIFE so the main bundle can load it via new Worker(url).
 */
import '@tensorflow/tfjs-backend-webgl'
import * as tf from '@tensorflow/tfjs-core'
import * as poseDetection from '@tensorflow-models/pose-detection'

type WorkerInitMessage = {
  type: 'init'
  maxPoses?: number
  enableSmoothing?: boolean
  modelType?: 'lite' | 'full'
}
type WorkerFrameMessage = {
  type: 'frame'
  rgb: Uint8Array
  width: number
  height: number
}
type WorkerMessage = WorkerInitMessage | WorkerFrameMessage

let detector: poseDetection.PoseDetector | null = null
let maxPoses = 1
let enableSmoothing = false
let modelTypeOption: 'lite' | 'full' = 'lite'

async function loadModel(): Promise<void> {
  if (detector) return
  await tf.setBackend('webgl')
  const modelType: poseDetection.MoveNetModelConfig['modelType'] =
    modelTypeOption === 'full'
      ? poseDetection.movenet.modelType.SINGLEPOSE_THUNDER
      : poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING
  detector = await poseDetection.createDetector(
    poseDetection.SupportedModels.MoveNet,
    { modelType, enableSmoothing, enableTracking: true },
  )
}

async function handleFrame(rgb: Uint8Array, width: number, height: number): Promise<void> {
  if (!detector) return
  const imageData = new ImageData(width, height)
  const data = imageData.data
  const len = width * height
  for (let i = 0; i < len; i++) {
    const i4 = i * 4
    const i3 = i * 3
    data[i4] = rgb[i3]
    data[i4 + 1] = rgb[i3 + 1]
    data[i4 + 2] = rgb[i3 + 2]
    data[i4 + 3] = 255
  }
  const poses = await detector.estimatePoses(imageData, {
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
      enableSmoothing = msg.enableSmoothing ?? false
      modelTypeOption = msg.modelType ?? 'lite'
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
    await handleFrame(msg.rgb, msg.width, msg.height)
  }
}
