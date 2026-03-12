let videoElement: HTMLVideoElement | null = null

export function getVideoElement(): HTMLVideoElement | null {
  return videoElement
}

export function setVideoElement(el: HTMLVideoElement | null): void {
  videoElement = el
}
