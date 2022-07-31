// Apply `maxSize`, which omits values if they their JSON size would be too
// high.
// Strings that are too long are completely omitted instead of being truncated:
//  - The truncation might make the value syntactically invalid, e.g. if it is a
//    serialized value
//  - This allows checking for strings being too large with `=== undefined`
//    instead of inspecting the `changes`
// The top-level value itself might become `undefined` if either:
//  - The `maxSize` option is very low (which is unlikely)
//  - The top-level value is a very long string
// This is applied incrementally, in a depth-first manner, so that omitted
// fields (due to being over `maxSize`) and their children are not processed
// at all, for performance reason.
export const addSize = function ({
  size,
  increment,
  maxSize,
  omittedProps,
  path,
  value,
}) {
  const newSize = size + increment
  const stop = newSize > maxSize

  if (!stop) {
    return { size: newSize, stop }
  }

  // eslint-disable-next-line fp/no-mutating-methods
  omittedProps.push({ path, value })
  return { size, stop }
}

// Compute the JSON size of a property value or top-level value
export const getValueSize = function (value) {
  if (value === undefined) {
    return 0
  }

  return typeof value === 'object' && value !== null ? 2 : getJsonLength(value)
}

// Compute the JSON size of an array comma
export const getArrayItemSize = function (empty) {
  return empty ? 0 : 1
}

// Compute the JSON size of an object property key
export const getObjectPropSize = function (key, empty) {
  return typeof key === 'symbol' ? 0 : getJsonLength(key) + (empty ? 1 : 2)
}

// We use `JSON.stringify()` to compute the length of strings (including
// property keys) to take into account escaping, including:
//  - Control characters and Unicode characters
//  - Invalid Unicode sequences
// This can throw if `value` is a large strings with many backslash sequences.
const getJsonLength = function (value) {
  try {
    return JSON.stringify(value).length
  } catch {
    return Number.POSITIVE_INFINITY
  }
}