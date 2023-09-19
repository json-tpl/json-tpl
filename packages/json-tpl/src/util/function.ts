export type ErrorHandler<E extends Error = Error> = (error: E) => never | void

export function thrower(error: Error): never {
  throw error
}

export function isNonNullable<T>(value: T): value is NonNullable<T> {
  return value != null
}
