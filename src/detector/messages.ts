import type { Pose } from '@tensorflow-models/pose-detection'

export type WorkerOutMessage =
  | { type: 'ready' }
  | { type: 'error'; message: string }
  | { type: 'poses'; poses: Pose[]; width: number; height: number }

export type MainToWorkerMessage =
  | { type: 'init'; maxPoses?: number; enableSmoothing?: boolean; modelType?: 'lite' | 'full' }
  | { type: 'frame'; rgb: Uint8Array; width: number; height: number }
