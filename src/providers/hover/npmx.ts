import type { Extractor } from '#types/extractor'
import type { HoverProvider, Position, TextDocument } from 'vscode'
import { Hover, MarkdownString } from 'vscode'

export class NpmxHoverProvider<T extends Extractor> implements HoverProvider {
  extractor: T

  constructor(extractor: T) {
    this.extractor = extractor
  }

  provideHover(document: TextDocument, position: Position) {
    const root = this.extractor.parse(document)
    if (!root)
      return

    const offset = document.offsetAt(position)
    const info = this.extractor.getDependencyInfoByOffset(root, offset)
    if (!info)
      return

    const { name } = info

    const md = new MarkdownString('')
    md.isTrusted = true

    md.appendMarkdown(`[View on npmx](https://npmx.dev/package/${name})  \n`)

    return new Hover(md)
  }
}
