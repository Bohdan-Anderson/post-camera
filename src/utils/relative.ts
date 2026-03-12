import type { Pose } from '@tensorflow-models/pose-detection'
import type { FrameOptions } from '../types/api.js'
import type { RelativeShoulderResult, RelativeKeypoint } from '../types/api.js'
import { avgBetween } from './geometry.js'
import { distanceBetween } from './geometry.js'

/**
 * Returns pose with center (shoulder midpoint in canvas-relative 0–1) and all keypoints
 * relative to that center (same structure as Pose.keypoints), plus body height.
 */
export function getRelativeToShoulders(
  pose: Pose,
  options: FrameOptions,
): RelativeShoulderResult {
  const kp = pose.keypoints
  const leftShoulder = kp[5]
  const rightShoulder = kp[6]
  const leftHip = kp[11]
  const rightHip = kp[12]
  if (!leftShoulder || !rightShoulder || !leftHip || !rightHip) {
    return {
      center: { x: 0, y: 0 },
      keypoints: [],
      bodyHeight: null,
    }
  }
  const centerPixel = avgBetween(leftShoulder, rightShoulder)
  const center = {
    x: centerPixel.x / options.width,
    y: centerPixel.y / options.height,
  }
  const hip = avgBetween(leftHip, rightHip)
  const bodyHeight = distanceBetween(centerPixel, hip, options)
  const keypoints: RelativeKeypoint[] = kp.map((point) => ({
    x: (point.x - centerPixel.x) / options.width,
    y: (point.y - centerPixel.y) / options.height,
    score: point.score ?? 0,
    name: point.name,
  }))
  return { center, keypoints, bodyHeight }
}
