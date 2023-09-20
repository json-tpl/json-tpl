export type ErrorHandler<E extends Error = Error> = (error: E) => never | void

export const noop: (...args: unknown[]) => void = () => {}

export function thrower(error: Error): never {
  throw error
}
