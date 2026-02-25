import type { DependencyInfo } from '#types/extractor'
import type { PackageInfo } from '#utils/api/package'
import { describe, expect, it } from 'vitest'
import { checkDistTag } from '../../src/providers/diagnostics/rules/dist-tag'

function createDependency(name: string, version: string): DependencyInfo {
  return {
    name,
    version,
    nameNode: {},
    versionNode: {},
  }
}

function createPackageInfo(distTags: Record<string, string>): PackageInfo {
  return { distTags } as PackageInfo
}

describe('checkDistTag', () => {
  const packageInfo = createPackageInfo({ latest: '2.0.0' })

  it('should flag when version matches a dist tag in metadata', async () => {
    const dependency = createDependency('lodash', 'latest')
    const result = await checkDistTag(dependency, packageInfo)

    expect(result).toBeDefined()
  })

  it('should not flag when version does not match any dist tag in metadata', async () => {
    const dependency = createDependency('lodash', 'next')
    const result = await checkDistTag(dependency, packageInfo)

    expect(result).toBeUndefined()
  })
})
