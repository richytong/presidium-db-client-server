/**
 * @name exists
 *
 * @docs
 * ```specscript
 * exists(value any) -> boolean
 * ```
 */
function exists(value) {
  return value != null
}

module.exports = exists
