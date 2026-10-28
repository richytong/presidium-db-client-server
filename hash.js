const crypto = require("crypto")

/**
 * @name hash
 *
 * @docs
 * ```specscript
 * hash(tableName string, key string, length number) -> index number
 * ```
 */
function hash(tableName, key, length) {
  const value = tableName
  const digest = crypto.createHash("md5").update(value).digest()
  const integerHash = digest.readUInt16BE(0)
  const index = Math.floor(integerHash / 65535 * length)
  return index
}

module.exports = hash
