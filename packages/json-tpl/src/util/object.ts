export type PlainObject = Record<string | number | symbol, unknown>
export function isPlainObject(value: object): value is PlainObject {
  const proto: unknown = Object.getPrototypeOf(value)
  return proto === Object.prototype || proto === null
}
