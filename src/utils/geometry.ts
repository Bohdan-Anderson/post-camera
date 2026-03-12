/**
 * Average of two points.
 */
export function avgBetween(
  a: { x: number; y: number },
  b: { x: number; y: number },
): { x: number; y: number } {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
}

/**
 * Distance between two points as a fraction of frame dimensions (0–1 scale).
 */
export function distanceBetween(
  a: { x: number; y: number },
  b: { x: number; y: number },
  options: { width: number; height: number },
): number {
  return Math.sqrt(
    (a.x / options.width - b.x / options.width) ** 2 +
      (a.y / options.height - b.y / options.height) ** 2,
  )
}
