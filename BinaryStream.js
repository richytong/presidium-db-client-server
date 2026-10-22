/**
 * Presidium DB Client and Server may be freely distributed under the CFOSS license.
 */

const EventEmitter = require("events")

/**
 * @name BinaryStream
 *
 * @docs
 * ```coffeescript [specscript]
 * module stream 'https://nodejs.org/docs/latest-v26.x/api/stream.html'
 * module events 'https://nodejs.org/docs/latest-v26.x/api/events.html'
 *
 * BinaryStream(readable stream.Readable, delimiter string) -> binaryStream events.EventEmitter
 *
 * textStream.on("data", chunk Buffer -> ())
 *
 * textStream.on("end", () -> ())
 * ```
 */
class BinaryStream extends EventEmitter {
  constructor(readable, delimiter) {
    super()

    delimiter ??= ""

    let buffer = Buffer.from("")
    readable.on('data', (chunk, encoding) => {
      if (typeof chunk == 'string') {
        buffer = Buffer.concat([buffer, Buffer.from(chunk, encoding)])
      } else {
        buffer = Buffer.concat([buffer, chunk])
      }

      let delimiterIndex = buffer.indexOf(delimiter)
      while (delimiterIndex > -1) {
        const slice = buffer.slice(0, delimiterIndex)
        this.emit("data", slice)
        buffer = buffer.slice(delimiterIndex + 1)
        delimiterIndex = buffer.indexOf(delimiter)
      }
    })

    readable.on('end', () => {
      if (buffer.length > 0) {
        this.emit("data", buffer)
      }
      this.emit("end")
    })
  }
}

module.exports = BinaryStream
