import type { ModuleReplacement } from '#utils/api/replacement'
import type { DiagnosticRule } from '..'
import { getReplacement } from '#utils/api/replacement'
import { DiagnosticSeverity } from 'vscode'

function getMdnUrl(path: string): string {
  return `https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/${path}`
}

function getReplacementsDocUrl(path: string): string {
  return `https://github.com/es-tooling/module-replacements/blob/main/docs/modules/${path}.md`
}

// https://github.com/npmx-dev/npmx.dev/blob/main/app/components/PackageReplacement.vue#L8-L30
function generateMessage(replacement: ModuleReplacement) {
  switch (replacement.type) {
    case 'native':
      return `This can be replaced with ${replacement.replacement}, available since Node ${replacement.nodeVersion}. Read more here: ${getMdnUrl(replacement.mdnPath)}`
    case 'simple':
      return `The community has flagged this package as redundant, with the advice: ${replacement.replacement}.`
    case 'documented':
      return `The community has flagged this package as having more performant alternatives. Read more here: ${getReplacementsDocUrl(replacement.docPath)}`
    case 'none':
      return 'This package has been flagged as no longer needed, and its functionality is likely available natively in all engines.'
  }
}

export const checkReplacement: DiagnosticRule = async (dep) => {
  const replacement = await getReplacement(dep.name)
  if (!replacement)
    return

  return {
    node: dep.nameNode,
    message: generateMessage(replacement),
    severity: DiagnosticSeverity.Warning,
  }
}
