export type ErrorHandler<E extends Error = Error> = (error: E) => never | void

export function thrower(error: Error): never {
  throw error
}

export function isDefined<T>(v: T): v is Exclude<T, undefined> {
  return v !== undefined
}

export function isNonNullable<T>(value: T): value is NonNullable<T> {
  return value != null
}

export function isNotFunction<T>(value: T): value is Exclude<T, (...a: unknown[]) => unknown> {
  return typeof value !== 'function'
}

export function isObject<T>(value: T): value is Extract<T, object> {
  return value != null && typeof value === 'object'
}
