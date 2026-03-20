import { config } from '#state'
import { SUPPORTED_DOCUMENT_PATTERN } from '#utils/constants'
import { watchEffect } from 'reactive-vscode'
import { languages } from 'vscode'
import { NpmxHoverProvider } from './npmx'

const HOVER_LANGUAGE_SELECTORS = [
  'javascript',
  'typescript',
  'javascriptreact',
  'typescriptreact',
  'vue',
  'astro',
  'svelte',
  'mdx',
  'html',
].map((language) => ({ scheme: 'file' as const, language }))

export function useHover() {
  watchEffect((onCleanup) => {
    if (!config.hover.enabled)
      return

    const disposable = languages.registerHoverProvider([
      { pattern: SUPPORTED_DOCUMENT_PATTERN },
      ...HOVER_LANGUAGE_SELECTORS,
    ], new NpmxHoverProvider())

    onCleanup(() => disposable.dispose())
  })
}
