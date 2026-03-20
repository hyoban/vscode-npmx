import { describe, expect, it } from 'vitest'
import { getImportSpecifierByOffset, getImportSpecifiers } from './import-specifier'

function getOffset(text: string, target: string): number {
  const index = text.indexOf(target)
  if (index === -1)
    throw new Error(`Missing target "${target}" in test input`)

  return index + 1
}

function getSpecifierRange(text: string, specifier: string): [number, number] {
  const target = `'${specifier}'`
  const index = text.indexOf(target)
  if (index === -1)
    throw new Error(`Missing target "${target}" in test input`)

  return [index + 1, index + 1 + specifier.length]
}

describe('getImportSpecifiers', () => {
  it('should extract common module specifiers', () => {
    const text = [
      'import foo from \'lodash\'',
      'import \'vite/client\'',
      'export * from \'@scope/pkg/subpath\'',
      'const react = require(\'react\')',
      'await import(\'zod\')',
    ].join('\n')

    expect(getImportSpecifiers(text)).toEqual([
      {
        specifier: 'lodash',
        packageName: 'lodash',
        range: getSpecifierRange(text, 'lodash'),
      },
      {
        specifier: 'vite/client',
        packageName: 'vite',
        range: getSpecifierRange(text, 'vite/client'),
      },
      {
        specifier: '@scope/pkg/subpath',
        packageName: '@scope/pkg',
        range: getSpecifierRange(text, '@scope/pkg/subpath'),
      },
      {
        specifier: 'react',
        packageName: 'react',
        range: getSpecifierRange(text, 'react'),
      },
      {
        specifier: 'zod',
        packageName: 'zod',
        range: getSpecifierRange(text, 'zod'),
      },
    ])
  })

  it.each([
    'import foo from \'./local\'',
    'import foo from \'../local\'',
    'import foo from \'/abs\'',
    'import foo from \'node:fs\'',
    'import foo from \'https://example.com/mod.ts\'',
  ])('should ignore unsupported specifier %s', (text) => {
    expect(getImportSpecifiers(text)).toEqual([])
  })
})

describe('getImportSpecifierByOffset', () => {
  it('should resolve by offset inside the quoted specifier', () => {
    const text = 'export * from \'@scope/pkg/subpath\''

    expect(getImportSpecifierByOffset(text, getOffset(text, '@scope/pkg/subpath'))).toEqual({
      specifier: '@scope/pkg/subpath',
      packageName: '@scope/pkg',
      range: getSpecifierRange(text, '@scope/pkg/subpath'),
    })
  })

  it('should return undefined outside import specifier ranges', () => {
    const text = 'import foo from \'lodash\''

    expect(getImportSpecifierByOffset(text, getOffset(text, 'import'))).toBeUndefined()
  })
})
