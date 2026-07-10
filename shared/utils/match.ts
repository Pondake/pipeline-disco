/** Convert a glob-style pattern ("renovate/*", "Draft:*") to a RegExp. */
export function globToRegExp(pattern: string): RegExp {
  const escaped = pattern
    .split('*')
    .map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .join('.*')
  return new RegExp(`^${escaped}$`, 'i')
}

export function matchesAny(value: string, patterns: string[]): boolean {
  return patterns.some((p) => p.trim() && globToRegExp(p.trim()).test(value))
}
