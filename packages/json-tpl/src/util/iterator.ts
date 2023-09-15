/* eslint-disable @typescript-eslint/no-explicit-any */

type IndexedIterator<T, TReturn = any, TNext = undefined> = Omit<
  Iterator<T, TReturn, TNext>,
  'next'
> & {
  next(...args: [] | [TNext]): IteratorResult<T, TReturn> & { index: number }
}

export function indexedIterator<T, TReturn = any, TNext = undefined>(
  it: Iterator<T, TReturn, TNext>
): IndexedIterator<T, TReturn, TNext> {
  let index = 0
  const next = (...args: [] | [TNext]) => {
    const result = it.next(...args)
    return { ...result, index: index++ }
  }
  return { ...it, next }
}
