const stream = require("stream")

/**
 * @name ArrayEventEmitter
 *
 * @docs
 * ```specscript
 * module EventEmitter "./specscript/EventEmitter.ss"
 *
 * ArrayEventEmitter(array Array<string|Buffer>) -> EventEmitter
 * ```
 */
function ArrayEventEmitter(array) {
  return stream.Readable.from(array)
}

module.exports = ArrayEventEmitter
