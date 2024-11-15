export function isArray<T>(value: T): value is Extract<T, unknown[]> {
  return value != null && Array.isArray(value)
}
