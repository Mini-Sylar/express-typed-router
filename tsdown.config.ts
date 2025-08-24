import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["src/schema-router.ts"],
  format: ["esm", "cjs"],
  dts: true,
  sourcemap: false,
  clean: true,
  outDir: "dist",
  external: ["express", "@standard-schema/spec", "@standard-schema/utils"],
  target: "es2022",
  platform: "node",
  minify: true,
  treeshake: true,
  skipNodeModulesBundle: true,
});
