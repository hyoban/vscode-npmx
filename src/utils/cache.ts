import { CACHE_TTL_ONE_DAY } from '#constants'
import { logger } from '#state'
import { LRUCache } from 'lru-cache'

export function createCachedFetch<T extends object>(
  key: string,
  fetchMethod: (name: string, staleValue: T | undefined, options: LRUCache.FetcherOptions<string, T, unknown>) => Promise<T | undefined>,
) {
  const cache = new LRUCache<string, T>({
    max: 500,
    ttl: CACHE_TTL_ONE_DAY,
    updateAgeOnGet: true,
    allowStale: true,
    fetchMethod: async (name, staleValue, options) => {
      try {
        logger.info(`[${name}]: fetching ${key}...`)
        const r = await fetchMethod(name, staleValue, options)
        logger.info(`[${name}] fetching ${key} done!`)
        return r
      } catch (err) {
        logger.warn(`[${name}] fetching ${key} error: `, err)
      }
    },
  })

  return async function getCache(name: string) {
    return (await cache.fetch(name))!
  }
}
