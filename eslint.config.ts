import { defineConfig } from '@vida0905/eslint-config'

export default defineConfig(
  {
    pnpm: true,
    ignores: ['playground'],
  },
  {
    files: ['src/commands/**'],
    rules: {
      'no-restricted-imports': ['error', {
        paths: [{
          name: 'reactive-vscode',
          message: 'Do not use reactive-vscode composables in command handlers. Use vscode API directly.',
        }],
      }],
    },
  },
)
