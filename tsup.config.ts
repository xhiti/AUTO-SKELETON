import { defineConfig } from "tsup";

export default defineConfig([
    // Main component bundle
    {
        entry: ["src/index.tsx"],
        format: ["cjs", "esm"],
        dts: true,
        splitting: false,
        sourcemap: true,
        clean: true,
        minify: true,
        external: ["react", "react-dom"],
        treeshake: true,
        esbuildOptions(options) {
            options.jsx = "automatic";
        },
    },
    // CSS bundle (copy styles to dist)
    {
        entry: ["src/styles.css"],
        outDir: "dist",
    },
]);