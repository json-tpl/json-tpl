const createReturnResult = <T>(value: T): IteratorReturnResult<T> => ({
  done: true,
  value,
})

const noopIteratorNext = createReturnResult.bind(
  undefined,
  undefined
) as () => IteratorReturnResult<undefined>
export function createNoopIterator<T>(): Iterator<T, undefined, unknown> {
  return { next: noopIteratorNext }
}
