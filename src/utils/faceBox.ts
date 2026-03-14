import type { Pose } from '@tensorflow-models/pose-detection'

/** Minimum keypoint score to include in the face box. */
const MIN_SCORE = 0.2

/** Face keypoint indices in MoveNet: nose, left_eye, right_eye, left_ear, right_ear. */
const FACE_KEYPOINT_INDICES = [0, 1, 2, 3, 4]

/**
 * Pixel-aligned bounding box for the face region derived from pose keypoints.
 */
export interface FaceBox {
  x: number
  y: number
  width: number
  height: number
}

/**
 * Computes a face bounding box from pose keypoints (nose, eyes, ears).
 * Uses padding and a minimum size; clamped to frame dimensions.
 *
 * @param pose - Pose from the detector (MoveNet keypoints).
 * @param frameWidth - Video/frame width in pixels.
 * @param frameHeight - Video/frame height in pixels.
 * @param padding - Fraction of box size to add on each side (default 0.4).
 * @param minSize - Minimum box side in pixels (default 64).
 * @returns Face box in pixel coordinates, or null if not enough keypoints.
 */
export function getFaceBox(
  pose: Pose,
  frameWidth: number,
  frameHeight: number,
  padding = 0.4,
  minSize = 64,
): FaceBox | null {
  const kp = pose.keypoints
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  let count = 0
  for (const i of FACE_KEYPOINT_INDICES) {
    const p = kp[i]
    if (!p || (p.score != null && p.score < MIN_SCORE)) continue
    minX = Math.min(minX, p.x)
    minY = Math.min(minY, p.y)
    maxX = Math.max(maxX, p.x)
    maxY = Math.max(maxY, p.y)
    count++
  }
  if (count < 2) return null
  let w = Math.max(maxX - minX, 1)
  let h = Math.max(maxY - minY, 1)
  const padX = w * padding
  const padY = h * padding
  let x = minX - padX
  let y = minY - padY
  w += 2 * padX
  h += 2 * padY
  if (w < minSize || h < minSize) {
    const scale = minSize / Math.min(w, h)
    const cx = x + w / 2
    const cy = y + h / 2
    w = Math.max(w * scale, minSize)
    h = Math.max(h * scale, minSize)
    x = cx - w / 2
    y = cy - h / 2
  }
  x = Math.round(Math.max(0, x))
  y = Math.round(Math.max(0, y))
  w = Math.round(Math.min(w, frameWidth - x))
  h = Math.round(Math.min(h, frameHeight - y))
  if (w <= 0 || h <= 0) return null
  return { x, y, width: w, height: h }
}
