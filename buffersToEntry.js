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
  if (entryLength == 3) {
    const key = buffers[0].toString(encoding)
    const value = valueType == "string"
      ? buffers[1].toString(encoding)
      : buffers[1]
    const sortValue = sortValueType == "number"
      ? Number(buffers[2].toString(encoding))
      : buffers[2].toString(encoding)
    return [key, value, sortValue]
  }
  const key = buffers[0].toString(encoding)
  const value = valueType == "string"
    ? buffers[1].toString(encoding)
    : buffers[1]
  return [key, value]
}

module.exports = buffersToEntry
