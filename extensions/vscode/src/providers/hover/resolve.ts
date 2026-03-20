import type { DependencyInfo } from '#core/workspace'
import type { TextDocument } from 'vscode'
import { getResolvedDependencies, getResolvedDependencyByOffset } from '#core/workspace'
import { isSupportedDependencyDocument } from '#utils/file'
import { getImportSpecifierByOffset } from '#utils/import-specifier'
import { PACKAGE_JSON_BASENAME } from 'npmx-language-core/constants'
import { findUp } from 'vscode-find-up'

export async function resolveHoverDependency(
  document: TextDocument,
  offset: number,
): Promise<DependencyInfo | undefined> {
  if (isSupportedDependencyDocument(document))
    return await getResolvedDependencyByOffset(document.uri, offset)

  if (document.uri.scheme !== 'file')
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
