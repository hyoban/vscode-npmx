import type { DependencyInfo } from '#core/workspace'
import type { Position, TextDocument } from 'vscode'
import { getResolvedDependencies, getResolvedDependencyByOffset } from '#core/workspace'
import { isSupportedDependencyDocument } from '#utils/file'
import { getImportSpecifierByOffset } from '#utils/import-specifier'
import { PACKAGE_JSON_BASENAME } from 'npmx-language-core/constants'
import { findUp } from 'vscode-find-up'

function findQuote(text: string, start: number, step: -1 | 1): number {
  for (let index = start; index >= 0 && index < text.length; index += step) {
    const char = text[index]
    if (char === '\'' || char === '"')
      return index
  }

  return -1
}

function isNearQuotedString(document: TextDocument, position: Position): boolean {
  const range = document.getWordRangeAtPosition(position)
  if (!range)
    return false

  const line = document.lineAt(position.line)
  const leftQuoteIndex = findQuote(line.text, range.start.character - 1, -1)
  if (leftQuoteIndex === -1)
    return false

  const rightQuoteIndex = findQuote(line.text, range.end.character, 1)
  if (rightQuoteIndex === -1)
    return false

  return line.text[leftQuoteIndex] === line.text[rightQuoteIndex]
}

export async function resolveHoverDependency(
  document: TextDocument,
  position: Position,
): Promise<DependencyInfo | undefined> {
  const offset = document.offsetAt(position)

  if (isSupportedDependencyDocument(document))
    return await getResolvedDependencyByOffset(document.uri, offset)

  if (document.uri.scheme !== 'file')
    return

  if (!isNearQuotedString(document, position))
    return

  const hit = getImportSpecifierByOffset(document.getText(), offset)
  if (!hit)
    return

  const pkgJsonUri = await findUp(PACKAGE_JSON_BASENAME, {
    cwd: document.uri,
  })
  if (!pkgJsonUri)
    return

  const dependencies = await getResolvedDependencies(pkgJsonUri)
  return dependencies?.find((dependency) => dependency.rawName === hit.packageName)
}
