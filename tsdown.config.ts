import { defineConfig } from 'tsdown'

/// keep-sorted
export default defineConfig({
  external: ['vscode'],
  minify: 'dce-only',
})
