export function isDefined<T> (value: T | undefined): value is T {
  return value !== undefined;
}

export function keyBy<T> (arr: T[], key: (item: T) => string): { [key: string]: T } {
  const ret: { [key: string]: T } = {};
  for (const item of arr) {
    ret[key(item)] = item;
  }
  return ret;
}