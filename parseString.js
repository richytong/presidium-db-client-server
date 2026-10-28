const numberRegex = /^[0-9\.]+$/

/**
 * @name parseString
 *
 * @docs
 * ```specscript
 * parseString(s string) -> number|string
 * ```
 */
function parseString(s) {
  if (typeof s == "string" && s.includes(this.delimiter)) {
    return s.split(this.delimiter)
  }
  if (numberRegex.test(s)) {
    return Number(s)
  }
  return s
}

module.exports = parseString
