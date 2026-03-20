import type { DependencyInfo } from '#core/workspace'
import type { TextDocument } from 'vscode'
import { getResolvedDependencies, getResolvedDependencyByOffset } from '#core/workspace'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { Uri } from 'vscode'
import { findUp } from 'vscode-find-up'
import { resolveHoverDependency } from './resolve'

vi.mock('#core/workspace', () => ({
  getResolvedDependencies: vi.fn(),
  getResolvedDependencyByOffset: vi.fn(),
}))

vi.mock('vscode-find-up', () => ({
  findUp: vi.fn(),
}))

const mockedGetResolvedDependencies = vi.mocked(getResolvedDependencies)
const mockedGetResolvedDependencyByOffset = vi.mocked(getResolvedDependencyByOffset)
const mockedFindUp = vi.mocked(findUp)

function getOffset(text: string, target: string): number {
  const index = text.indexOf(target)
  if (index === -1)
    throw new Error(`Missing target "${target}" in test input`)

  return index + 1
}

function createDependencyInfo(overrides: Partial<DependencyInfo> = {}): DependencyInfo {
  return {
    category: 'dependencies',
    rawName: 'lodash',
    rawSpec: '^1.0.0',
    nameRange: [0, 0],
    specRange: [0, 0],
    protocol: null,
    resolvedName: 'lodash',
    resolvedSpec: '^1.0.0',
    resolvedProtocol: 'npm',
    packageInfo: async () => null,
    resolvedVersion: async () => null,
    ...overrides,
  }
}

function createDocument(path: string, text: string): TextDocument {
  return {
    uri: Uri.file(path),
    getText: () => text,
  } as TextDocument
}

describe('resolveHoverDependency', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should resolve source imports from the nearest package.json', async () => {
    const text = 'import foo from \'lodash\''
    const document = createDocument('/workspace/src/index.ts', text)
    const pkgJsonUri = Uri.file('/workspace/package.json')
    const dependency = createDependencyInfo()

    mockedFindUp.mockResolvedValue(pkgJsonUri)
    mockedGetResolvedDependencies.mockResolvedValue([dependency])

    const resolved = await resolveHoverDependency(document, getOffset(text, 'lodash'))

    expect(resolved).toBe(dependency)
    expect(mockedFindUp).toHaveBeenCalledWith('package.json', { cwd: document.uri })
    expect(mockedGetResolvedDependencies).toHaveBeenCalledWith(pkgJsonUri)
  })

  it('should match package roots for import subpaths', async () => {
    const text = 'import \'lodash/fp\''
    const document = createDocument('/workspace/src/index.ts', text)
    const dependency = createDependencyInfo()

    mockedFindUp.mockResolvedValue(Uri.file('/workspace/package.json'))
    mockedGetResolvedDependencies.mockResolvedValue([dependency])

    const resolved = await resolveHoverDependency(document, getOffset(text, 'lodash/fp'))

    expect(resolved).toBe(dependency)
  })

  it('should reuse aliased dependency metadata', async () => {
    const text = 'import \'foo/subpath\''
    const document = createDocument('/workspace/src/index.ts', text)
    const dependency = createDependencyInfo({
      rawName: 'foo',
      rawSpec: 'npm:bar@^2.0.0',
      protocol: 'npm',
      resolvedName: 'bar',
      resolvedSpec: '^2.0.0',
    })

    mockedFindUp.mockResolvedValue(Uri.file('/workspace/package.json'))
    mockedGetResolvedDependencies.mockResolvedValue([dependency])

    const resolved = await resolveHoverDependency(document, getOffset(text, 'foo/subpath'))

    expect(resolved).toBe(dependency)
    expect(resolved?.resolvedName).toBe('bar')
  })

  it('should return undefined for undeclared imports', async () => {
    const text = 'import \'react\''
    const document = createDocument('/workspace/src/index.ts', text)

    mockedFindUp.mockResolvedValue(Uri.file('/workspace/package.json'))
    mockedGetResolvedDependencies.mockResolvedValue([
      createDependencyInfo({ rawName: 'lodash' }),
    ])

    await expect(resolveHoverDependency(document, getOffset(text, 'react'))).resolves.toBeUndefined()
  })

  it('should keep package manifest hover on the existing path', async () => {
    const document = createDocument('/workspace/package.json', '"dependencies": { "lodash": "^1.0.0" }')
    const dependency = createDependencyInfo()

    mockedGetResolvedDependencyByOffset.mockResolvedValue(dependency)

    const resolved = await resolveHoverDependency(document, 20)

    expect(resolved).toBe(dependency)
    expect(mockedGetResolvedDependencyByOffset).toHaveBeenCalledWith(document.uri, 20)
    expect(mockedFindUp).not.toHaveBeenCalled()
    expect(mockedGetResolvedDependencies).not.toHaveBeenCalled()
  })
})
