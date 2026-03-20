import { config } from '#state'
import { watchEffect } from 'reactive-vscode'
import { languages } from 'vscode'
import { NpmxHoverProvider } from './npmx'

export function useHover() {
  watchEffect((onCleanup) => {
    if (!config.hover.enabled)
      return

    const disposable = languages.registerHoverProvider({ scheme: 'file' }, new NpmxHoverProvider())

    onCleanup(() => disposable.dispose())
  })
}
