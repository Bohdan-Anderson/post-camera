import type { PoseCameraAPI, InitOptions, StartOptions } from './types/api.js'
import { getStatus, setStatus, subscribe, resetStatus } from './state/store.js'
import {
  setVideoElement,
  selectCamera,
  getAvailableCamerasWithPermission,
  stopCamera,
  isStreamActive,
  getVideoElement,
} from './camera/index.js'
import * as detector from './detector/index.js'
import * as face from './face/index.js'
import { createUtils } from './utils/index.js'
import { getMediaPermission } from './camera/index.js'

export function createPoseCamera(): PoseCameraAPI {
  const utils = createUtils()

  return {
    get status() {
      return getStatus()
    },
    setVideoElement(el) {
      setVideoElement(el)
    },
    onFrame(cb) {
      return detector.addFrameCallback(cb)
    },
    onFaceUpdate(cb) {
      return face.addFaceCallback(cb)
    },
    setFaceSnapshotOptions(opts) {
      face.setFaceOptions(opts)
    },
    onStatusChange(cb) {
      return subscribe(cb)
    },
    async init(options?: InitOptions) {
      face.setFaceOptions(options?.faceSnapshots)
      await detector.init(options)
    },
    async getAvailableCameras() {
      return getAvailableCamerasWithPermission()
    },
    async selectCamera(deviceId, constraints) {
      await selectCamera(deviceId, constraints)
    },
    startTracking() {
      detector.startTracking()
    },
    stopTracking() {
      detector.stopTracking()
    },
    dispose() {
      detector.stopTracking()
      detector.dispose()
      stopCamera()
      resetStatus()
    },
    async start(options?: StartOptions) {
      await this.init(options)
      const permission = await getMediaPermission()
      setStatus({ mediaPermission: permission })
      const cameras = await this.getAvailableCameras()
      if (options?.deviceId && cameras.some((c) => c.deviceId === options.deviceId)) {
        await this.selectCamera(options.deviceId, options?.constraints)
      } else if (cameras.length > 0 && !getVideoElement()) {
        await this.selectCamera(cameras[0].deviceId, options?.constraints)
      }
      if (isStreamActive() && getVideoElement()) {
        this.startTracking()
      }
    },
    utils,
  }
}
