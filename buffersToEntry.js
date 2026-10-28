/**
 * Presidium DB Client and Server may be freely distributed under the CFOSS license.
 */

function _convertPrimitive(value, t) {
  if (t == "number") {
    return Number(value)
  }
  return value
}

/**
 * @name buffersToEntry
 *
 * @docs
 * ```specscript
 * buffersToEntry(
 *   buffers Array<Buffer>,
 *   entryLength number,
 *   encoding string,
 *   valueType string,
 * ) -> Array<string, Buffer>
 *
 * buffersToEntry(
 *   buffers Array<Buffer>,
 *   entryLength number,
 *   encoding string,
 *   valueType string,
 *   sortValueType string
 * ) -> Array<string, Buffer>
 * ```
 */
function buffersToEntry(buffers, entryLength, encoding, valueType, sortValueType) {
  if (entryLength > 2) {
    const key = buffers[0].toString(encoding)
    const value = valueType == "string"
      ? buffers[1].toString(encoding)
      : buffers[1]
    const sortValue = buffers.slice(2)
    for (let i = 0; i < sortValue.length; i++) {
      sortValue[i] = _convertPrimitive(sortValue[i].toString(encoding), sortValueType[i])
    }
    return [key, value, ...sortValue]
  }
  const key = buffers[0].toString(encoding)
  const value = valueType == "string"
    ? buffers[1].toString(encoding)
    : buffers[1]
  return [key, value]
}

module.exports = buffersToEntry
