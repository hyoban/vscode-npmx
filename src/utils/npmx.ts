import type { ModuleReplacement } from 'module-replacements'
import { ofetch } from 'ofetch'
import { createCachedFetch } from './cache'
import { encodePackageName } from './npm'

export const NPMX_DEV_API = 'https://npmx.dev/api'

export const getReplacement = createCachedFetch<ModuleReplacement>(
  'replacement',
  (name, staleValue, { signal }) => {
    const encodedName = encodePackageName(name)

    return ofetch<ModuleReplacement>(`${NPMX_DEV_API}/replacements/${encodedName}`, { signal })
      // Fallback for cache compatibility (LRUCache rejects null/undefined)
      ?? {}
  },
)
