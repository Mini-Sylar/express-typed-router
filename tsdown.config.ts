import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["src/zod-router.ts"],
  format: ["esm", "cjs"],
  dts: true,
  sourcemap: false,
  clean: true,
  outDir: "dist",
  external: ["express", "zod"],
  target: "es2022",
  platform: "node",
  minify: true,
  treeshake: true,
  skipNodeModulesBundle: true,
});
