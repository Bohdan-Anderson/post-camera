import type { Pose } from '@tensorflow-models/pose-detection'

/** Minimum keypoint score to include in the face box. */
const MIN_SCORE = 0.2

/** Face keypoint indices in MoveNet: nose, left_eye, right_eye, left_ear, right_ear. */
const FACE_KEYPOINT_INDICES = [0, 1, 2, 3, 4]

/** Box width = eye distance × this factor ("a bit wider than the eyes"). */
const EYE_DISTANCE_WIDTH_FACTOR = 2.2

/** Box height = width × this (face is taller than wide in the crop). */
const HEIGHT_ASPECT = 1.2

/**
 * Pixel-aligned bounding box for the face region derived from pose keypoints.
 */
export interface FaceBox {
  x: number
  y: number
  width: number
  height: number
}

function scoreOk(p: { score?: number } | undefined): boolean {
  return !!p && (p.score == null || p.score >= MIN_SCORE)
}

/**
 * Computes a face bounding box from pose keypoints.
 * When both eyes are visible, crops tightly: box width is slightly wider than the eye distance,
 * height proportional. Otherwise falls back to a padded bounding box of nose/eyes/ears.
 * Clamped to frame dimensions; small boxes are scaled up to minSize.
 *
 * @param pose - Pose from the detector (MoveNet keypoints).
 * @param frameWidth - Video/frame width in pixels.
 * @param frameHeight - Video/frame height in pixels.
 * @param padding - Fraction of box size to add (fallback path only; default 0.4).
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
  const leftEye = kp[1]
  const rightEye = kp[2]
  const nose = kp[0]

  if (scoreOk(leftEye) && scoreOk(rightEye)) {
    const eyeDx = rightEye!.x - leftEye!.x
    const eyeDy = rightEye!.y - leftEye!.y
    const eyeDistance = Math.hypot(eyeDx, eyeDy) || 1
    let w = eyeDistance * EYE_DISTANCE_WIDTH_FACTOR
    let h = w * HEIGHT_ASPECT
    const centerX = (leftEye!.x + rightEye!.x) / 2
    const centerY = scoreOk(nose) ? nose!.y : (leftEye!.y + rightEye!.y) / 2
    let x = centerX - w / 2
    let y = centerY - h / 2
    if (w < minSize || h < minSize) {
      const scale = minSize / Math.min(w, h)
      w = Math.max(w * scale, minSize)
      h = Math.max(h * scale, minSize)
      x = centerX - w / 2
      y = centerY - h / 2
    }
    x = Math.round(Math.max(0, x))
    y = Math.round(Math.max(0, y))
    w = Math.round(Math.min(w, frameWidth - x))
    h = Math.round(Math.min(h, frameHeight - y))
    if (w <= 0 || h <= 0) return null
    return { x, y, width: w, height: h }
  }

  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  let count = 0
  for (const i of FACE_KEYPOINT_INDICES) {
    const p = kp[i]
    if (!scoreOk(p)) continue
    minX = Math.min(minX, p!.x)
    minY = Math.min(minY, p!.y)
    maxX = Math.max(maxX, p!.x)
    maxY = Math.max(maxY, p!.y)
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
