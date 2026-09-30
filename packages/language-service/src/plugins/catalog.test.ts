import { describe, expect, it } from 'vitest'
import { TextDocument } from 'vscode-languageserver-textdocument'
import { createDependencyInfo } from '../test-utils/dependency'
import { getCatalogDependencyAtOffset, getCatalogInlayHints } from './catalog'

describe('getCatalogDependencyAtOffset', () => {
  const dependency = createDependencyInfo({
    rawSpec: 'catalog:',
    nameRange: [10, 16],
    specRange: [20, 28],
    protocol: 'catalog',
    categoryName: 'default',
  })

  it('matches catalog specs separately from package names', () => {
    expect(getCatalogDependencyAtOffset([dependency], 10)).toBeUndefined()
    expect(getCatalogDependencyAtOffset([dependency], 20)).toBe(dependency)
    expect(getCatalogDependencyAtOffset([dependency], 28)).toBe(dependency)
  })

  it('ignores non-catalog specs', () => {
    const npmDependency = createDependencyInfo({
      rawSpec: '^1.0.0',
      protocol: 'npm',
      specRange: [20, 28],
    })

    expect(getCatalogDependencyAtOffset([npmDependency], 20)).toBeUndefined()
  })
})

describe('getCatalogInlayHints', () => {
  it.each(['catalog:', 'catalog:dev'])('places the %s hint outside the quoted spec', (rawSpec) => {
    const text = `{"dependencies":{"lodash":"${rawSpec}","vue":"^3.0.0"}}`
    const document = TextDocument.create('file:///repo/package.json', 'json', 0, text)
    const specStart = text.indexOf(rawSpec)
    const specEnd = specStart + rawSpec.length
    const range = { start: document.positionAt(0), end: document.positionAt(text.length) }
    const dependencies = [createDependencyInfo({
      rawSpec,
      protocol: 'catalog',
      resolvedSpec: '^4.0.0',
      specRange: [specStart, specEnd],
    })]

    expect(getCatalogInlayHints(document, range, dependencies)).toEqual([{
      position: document.positionAt(text.indexOf(',"vue"')),
      label: '^4.0.0',
      paddingLeft: true,
    }])
  })
})
