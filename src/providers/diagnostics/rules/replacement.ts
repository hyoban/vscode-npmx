import type { ModuleReplacement } from '#utils/api/replacement'
import type { DiagnosticRule } from '..'
import { getReplacement } from '#utils/api/replacement'
import { DiagnosticSeverity } from 'vscode'

// https://github.com/es-tooling/eslint-plugin-depend/blob/5f81ab8b0a0a48f2b528dd47a78964e533b5a699/src/util/rule-meta.ts#L10-L26
function getMdnUrl(path: string): string {
  return `https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/${path}`
}

function getReplacementsDocUrl(path: string): string {
  return `https://github.com/es-tooling/module-replacements/blob/main/docs/modules/${path}.md`
}

// https://github.com/es-tooling/eslint-plugin-depend/blob/5f81ab8b0a0a48f2b528dd47a78964e533b5a699/src/rules/ban-dependencies.ts#L59-L69
// https://github.com/npmx-dev/npmx.dev/blob/main/app/components/PackageReplacement.vue#L8-L30
function generateMessage(replacement: ModuleReplacement) {
  switch (replacement.type) {
    case 'native':
      return `${replacement.moduleName} should be replaced with native functionality. `
        + `You can instead use ${replacement.replacement}. Read more here: ${getMdnUrl(replacement.mdnPath)}`
    case 'simple':
      return `${replacement.moduleName} should be replaced with inline/local logic. `
        + `You can instead use ${replacement.replacement}.`
    case 'documented':
      return `${replacement.moduleName} should be replaced with an alternative package. `
        + `Read more here: ${getReplacementsDocUrl(replacement.docPath)}`
    case 'none':
      return `${replacement.moduleName} is a banned dependency. An alternative should be used.`
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
