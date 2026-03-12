import { getVideoElement } from './element.js'

let stream: MediaStream | null = null

export function getStream(): MediaStream | null {
  return stream
}

export function setStream(s: MediaStream | null): void {
  stream = s
}

export function isStreamActive(): boolean {
  return stream !== null && stream.active
}

export function stopStream(): void {
  if (stream) {
    stream.getTracks().forEach((t) => t.stop())
    stream = null
  }
  const el = getVideoElement()
  if (el) {
    el.srcObject = null
    el.pause()
  }
}

export async function startStream(
  deviceId: string,
  constraints?: MediaTrackConstraints,
): Promise<void> {
  stopStream()
  const opts: MediaStreamConstraints = {
    video: constraints
      ? { deviceId: { exact: deviceId }, ...constraints }
      : { deviceId: { exact: deviceId } },
  }
  const s = await navigator.mediaDevices.getUserMedia(opts)
  setStream(s)
  const el = getVideoElement()
  if (el) {
    el.srcObject = s
    el.play()
  }
}
