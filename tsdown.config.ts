import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['src/zod-router.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  clean: true,
  outDir: 'dist',
  external: ['express', 'zod'],
  target: 'es2022',
  platform: 'node',
  minify: false,
  treeshake: true,
  skipNodeModulesBundle: true,
}) 
