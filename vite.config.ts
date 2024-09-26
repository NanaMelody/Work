import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import typescript from "@rollup/plugin-typescript";
import dts from "vite-plugin-dts";
import { resolve } from "path";
import { viteExternalsPlugin } from "vite-plugin-externals";
// import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  // plugins: [react()],
  plugins: [
    react(),
    typescript({
      target: "es5",
      rootDir: "packages/",

      declaration: true,
      declarationDir: "dist",
      exclude: "node_modules/**",
      allowSyntheticDefaultImports: true,
    }),
    dts(),
    viteExternalsPlugin({
      "@alilc/lowcode-engine": "var window.AliLowCodeEngine",
    }),
  ],
  build: {
    lib: {
      entry: "packages/CreatFile/index.tsx",
      name: "CreatFile",
      fileName: "file-tree",
    },
    rollupOptions: {
      // 确保外部化处理那些你不想打包进库的依赖
      external: ["react", "react-dom", "@types/antd", "antd", "lodash"],
      input: "./packages/index.tsx",
      output: {
        // 在 UMD 构建模式下为这些外部化的依赖提供一个全局变量
        globals: {
          react: "react",
          "react-dom": "react-dom",
          "@types/antd": "@types/antd",
          antd: "antd",
          lodash: "lodash",
        },
      },
    },
  },
});
