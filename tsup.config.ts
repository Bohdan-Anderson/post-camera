import { defineConfig } from 'tsup'

export default defineConfig([
  {
    entry: { index: 'src/index.ts' },
    format: ['esm', 'cjs'],
    dts: true,
    outDir: 'dist',
    external: [
      '@tensorflow-models/pose-detection',
      '@tensorflow/tfjs-core',
      '@tensorflow/tfjs-backend-webgl',
    ],
    sourcemap: true,
  },
  {
    entry: { 'pose-camera-worker': 'src/detector/worker.ts' },
    format: ['iife'],
    outDir: 'dist',
    outExtension: () => ({ js: '.js' }),
    noExternal: [
      '@tensorflow-models/pose-detection',
      '@tensorflow/tfjs-core',
      '@tensorflow/tfjs-backend-webgl',
    ],
    platform: 'browser',
    target: 'es2020',
    sourcemap: true,
  },
])
