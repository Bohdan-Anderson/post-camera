import type { Pose } from '@tensorflow-models/pose-detection'

export type WorkerOutMessage =
  | { type: 'ready' }
  | { type: 'error'; message: string }
  | { type: 'poses'; poses: Pose[]; width: number; height: number }

export type MainToWorkerMessage =
  | { type: 'init'; maxPoses?: number }
  | { type: 'frame'; imageData: ImageData; width: number; height: number }
