import type { OffsetRange } from 'npmx-language-core/types'
import { isOffsetInRange } from './ast'

export interface ImportSpecifierHit {
  specifier: string
  packageName: string
  range: OffsetRange
}

interface ImportSpecifierPattern {
  regex: RegExp
}

const IMPORT_SPECIFIER_PATTERNS: ImportSpecifierPattern[] = [
  {
    regex: /(import\s[\s\S]*?\sfrom\s*)(['"])([^'"\\]*(?:\\.[^'"\\]*)*)\2/g,
  },
  {
    regex: /(import\s*)(['"])([^'"\\]*(?:\\.[^'"\\]*)*)\2/g,
  },
  {
    regex: /(export\s[\s\S]*?\sfrom\s*)(['"])([^'"\\]*(?:\\.[^'"\\]*)*)\2/g,
  },
  {
    regex: /(require\s*\(\s*)(['"])([^'"\\]*(?:\\.[^'"\\]*)*)\2(\s*\))/g,
  },
  {
    regex: /(import\s*\(\s*)(['"])([^'"\\]*(?:\\.[^'"\\]*)*)\2(\s*\))/g,
  },
]

const RELATIVE_IMPORT_PATTERN = /^\.{1,2}(?:\/|$)/
const ABSOLUTE_IMPORT_PATTERN = /^\//
const PROTOCOL_IMPORT_PATTERN = /^[a-z][a-z\d+.-]*:/i
const STATEMENT_SUFFIX_PATTERN = /^\s*(?:;.*)?$/
const CALL_SUFFIX_PATTERN = /^\s*\)/
const FROM_IMPORT_PREFIX_PATTERN = /(?:\b|\s+)from\s+$/
const BARE_IMPORT_PREFIX_PATTERN = /(?:\b|\s+)import\s+$/
const DYNAMIC_IMPORT_PREFIX_PATTERN = /(?:\b|\{|\s+)import\s*\(\s*$/
const REQUIRE_PREFIX_PATTERN = /(?:\b|\s+)require\s*\(\s*$/

function parsePackageName(specifier: string): string | undefined {
  if (
    RELATIVE_IMPORT_PATTERN.test(specifier)
    || ABSOLUTE_IMPORT_PATTERN.test(specifier)
    || PROTOCOL_IMPORT_PATTERN.test(specifier)
  ) {
    return
  }

  if (specifier.startsWith('@')) {
    const segments = specifier.split('/')
    if (segments.length < 2)
      return

    return `${segments[0]}/${segments[1]}`
  }

  const [packageName] = specifier.split('/')
  return packageName || undefined
}

function toImportSpecifierHit(match: RegExpExecArray): ImportSpecifierHit | undefined {
  const prefix = match[1]
  const quote = match[2]
  const specifier = match[3]

  if (!prefix || !quote || specifier === undefined)
    return

  const packageName = parsePackageName(specifier)
  if (!packageName)
    return

  const start = match.index + prefix.length + quote.length

  return {
    specifier,
    packageName,
    range: [start, start + specifier.length],
  }
}

function insertOrderedHit(hits: ImportSpecifierHit[], hit: ImportSpecifierHit) {
  const existingIndex = hits.findIndex((item) => item.range[0] === hit.range[0])
  if (existingIndex >= 0) {
    hits[existingIndex] = hit
    return
  }

  const index = hits.findIndex((item) => item.range[0] > hit.range[0])
  if (index === -1) {
    hits.push(hit)
    return
  }

  hits.splice(index, 0, hit)
}

function findQuote(text: string, start: number, step: -1 | 1): number {
  for (let index = start; index >= 0 && index < text.length; index += step) {
    const char = text[index]
    if (char === '\'' || char === '"')
      return index
  }

  return -1
}

export function getImportSpecifiers(text: string): ImportSpecifierHit[] {
  const hits: ImportSpecifierHit[] = []

  for (const { regex } of IMPORT_SPECIFIER_PATTERNS) {
    regex.lastIndex = 0

    for (let match = regex.exec(text); match; match = regex.exec(text)) {
      const hit = toImportSpecifierHit(match)
      if (!hit)
        continue

      insertOrderedHit(hits, hit)
    }
  }

  return hits
}

export function getImportSpecifierByOffset(text: string, offset: number): ImportSpecifierHit | undefined {
  return getImportSpecifiers(text)
    .find((hit) => isOffsetInRange(offset, hit.range))
}

export function getImportSpecifierInLine(text: string, range: OffsetRange): ImportSpecifierHit | undefined {
  const [start, end] = range
  const leftQuoteIndex = findQuote(text, start - 1, -1)
  if (leftQuoteIndex === -1)
    return

  const rightQuoteIndex = findQuote(text, end, 1)
  if (rightQuoteIndex === -1 || text[leftQuoteIndex] !== text[rightQuoteIndex])
    return

  const specifier = text.slice(leftQuoteIndex + 1, rightQuoteIndex)
  const packageName = parsePackageName(specifier)
  if (!packageName)
    return

  const before = text.slice(0, leftQuoteIndex)
  const after = text.slice(rightQuoteIndex + 1)

  const isModule
    = (FROM_IMPORT_PREFIX_PATTERN.test(before) && STATEMENT_SUFFIX_PATTERN.test(after))
      || (BARE_IMPORT_PREFIX_PATTERN.test(before) && STATEMENT_SUFFIX_PATTERN.test(after))
      || (DYNAMIC_IMPORT_PREFIX_PATTERN.test(before) && CALL_SUFFIX_PATTERN.test(after))
      || (REQUIRE_PREFIX_PATTERN.test(before) && CALL_SUFFIX_PATTERN.test(after))

  if (!isModule)
    return

  return {
    specifier,
    packageName,
    range: [leftQuoteIndex + 1, rightQuoteIndex],
  }
}
