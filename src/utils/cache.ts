// Cache system now uses SQLite instead of localStorage
// This is a simplified cache that delegates to the main SQLite system

interface CacheEntry {
  v: string
  ts: number
  ttl?: number
  last?: number
  freq: number
  ver: number
}

interface SetOptions {
  ttl?: number | null
  priority?: number
}

interface CacheMetrics {
  hits: number
  misses: number
  evictions: number
  items: number
  compressedBytes: number
  rawBytes: number
  maxBytes: number
}

// Simple in-memory cache since we have SQLite for persistence
const memoryCache = new Map<string, CacheEntry>()
const metrics: CacheMetrics = {
  hits: 0,
  misses: 0,
  evictions: 0,
  items: 0,
  compressedBytes: 0,
  rawBytes: 0,
  maxBytes: 8 * 1024 * 1024,
}

function now() {
  return Date.now()
}

function ensureNotExpired(e: CacheEntry): boolean {
  if (!e.ttl) return true
  return now() - e.ts < e.ttl
}

export const Cache = {
  get<T = any>(key: string): T | null {
    const entry = memoryCache.get(key)
    if (!entry) {
      metrics.misses++
      return null
    }
    
    if (!ensureNotExpired(entry)) {
      memoryCache.delete(key)
      metrics.misses++
      metrics.items--
      return null
    }
    
    entry.freq = (entry.freq || 0) + 1
    entry.last = now()
    metrics.hits++
    
    try {
      const value = JSON.parse(entry.v)
      return value as T
    } catch {
      return entry.v as T
    }
  },

  set(key: string, value: any, opts: SetOptions = {}) {
    const strValue = typeof value === 'string' ? value : JSON.stringify(value)
    const entry: CacheEntry = {
      v: strValue,
      ts: now(),
      ttl: opts.ttl ?? undefined,
      last: now(),
      freq: 1,
      ver: 1,
    }
    
    // Simple eviction if cache is too large
    if (memoryCache.size > 1000) {
      const oldestKey = memoryCache.keys().next().value
      memoryCache.delete(oldestKey)
      metrics.evictions++
      metrics.items--
    }
    
    memoryCache.set(key, entry)
    metrics.items++
    metrics.compressedBytes += strValue.length
    
    window.dispatchEvent(new CustomEvent('cacheUpdated', { detail: key }))
  },

  remove(key: string) {
    if (memoryCache.has(key)) {
      memoryCache.delete(key)
      metrics.items--
      window.dispatchEvent(new CustomEvent('cacheUpdated', { detail: key }))
    }
  },

  has(key: string): boolean {
    const entry = memoryCache.get(key)
    if (!entry) return false
    
    if (!ensureNotExpired(entry)) {
      memoryCache.delete(key)
      metrics.items--
      return false
    }
    
    return true
  },

  getMetrics(): CacheMetrics {
    return { ...metrics }
  },

  setMaxBytes(bytes: number) {
    metrics.maxBytes = bytes
  },

  clearAll() {
    memoryCache.clear()
    metrics.hits = 0
    metrics.misses = 0
    metrics.evictions = 0
    metrics.items = 0
    metrics.compressedBytes = 0
    metrics.rawBytes = 0
    window.dispatchEvent(new CustomEvent('cacheUpdated'))
  },
}

export function cacheGetWithFallback<T = any>(plainKey: string): T | null {
  const fromCache = Cache.get<T>(plainKey)
  return fromCache
}

export function cacheSet<T = any>(plainKey: string, value: T, opts: SetOptions = {}) {
  Cache.set(plainKey, value, opts)
}