import { describe, expect, it } from 'vitest'
import { getImportSpecifierInLine } from './source-import'

function getRange(text: string, target: string, fromIndex = 0): [number, number] {
  const index = text.indexOf(target, fromIndex)
  if (index === -1)
    throw new Error(`Missing target "${target}" in test input`)

  return [index, index + target.length]
}

function getLastRange(text: string, target: string): [number, number] {
  const index = text.lastIndexOf(target)
  if (index === -1)
    throw new Error(`Missing target "${target}" in test input`)

  return [index, index + target.length]
}

describe('getImportSpecifierInLine', () => {
  it.each([
    ['import foo from \'lodash\'', 'lodash', 'lodash', 0],
    ['import \'vite/client\'', 'vite', 'vite/client', 0],
    ['export * from \'@scope/pkg/subpath\'', '@scope/pkg', '@scope/pkg/subpath', 0],
    ['await import(\'zod\')', 'zod', 'zod', 0],
  ])('should extract import specifier from %s', (text, packageName, specifier, fromIndex) => {
    expect(getImportSpecifierInLine(text, getRange(text, packageName, fromIndex))).toEqual({
      specifier,
      packageName,
    })
  })

  it('should extract import specifier from require call', () => {
    const text = 'const react = require(\'react\')'

    expect(getImportSpecifierInLine(text, getLastRange(text, 'react'))).toEqual({
      specifier: 'react',
      packageName: 'react',
    })
  })

  it.each([
    ['import foo from \'./local\'', 'local'],
    ['import foo from \'../local\'', 'local'],
    ['import foo from \'/abs\'', 'abs'],
    ['import foo from \'node:fs\'', 'fs'],
    ['import foo from \'https://example.com/mod.ts\'', 'example'],
  ])('should ignore unsupported specifier in %s', (text, target) => {
    expect(getImportSpecifierInLine(text, getRange(text, target))).toBeUndefined()
  })

  it('should return undefined outside import syntax', () => {
    const text = 'const lodash = someValue'

    expect(getImportSpecifierInLine(text, getRange(text, 'lodash'))).toBeUndefined()
  })

  it('should return undefined when the current line does not contain the import context', () => {
    const text = '\'lodash\''

    expect(getImportSpecifierInLine(text, getRange(text, 'lodash'))).toBeUndefined()
  })
})
