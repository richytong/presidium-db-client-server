/**
 * @name toString
 *
 * @docs
 * ```specscript
 * toString(value) -> string
 * ```
 */
function toString(value) {
  if (Array.isArray(value)) {
    return value.join(this.delimiter)
  }
  if (typeof value == "string") {
    return value
  }
  return value.toString()
}

module.exports = toString
