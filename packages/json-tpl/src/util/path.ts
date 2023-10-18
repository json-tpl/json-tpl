export type PathFragment = number | string
export type Path = PathFragment[]

export function isPathFragment(value: unknown): value is PathFragment {
  return typeof value === 'number' || typeof value === 'string'
}

export function isPath(value: unknown): value is Path {
  return Array.isArray(value) && value.every(isPathFragment)
}

export function combinePaths(root: Readonly<Path>, child?: Readonly<Path>): Readonly<Path> {
  if (!child?.length) return root
  if (!root.length) return child
  return root.concat(child)
}

export function stringifyPath(path: Readonly<Path>): string {
  return `$${path.map((f) => (typeof f === 'number' ? `[${f}]` : `.${f}`)).join('')}`
}
