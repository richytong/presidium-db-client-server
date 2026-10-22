/**
 * Presidium DB Client and Server may be freely distributed under the CFOSS license.
 */

const EventEmitter = require("events")

/**
 * @name TextStream
 *
 * @docs
 * ```coffeescript [specscript]
 * module stream 'https://nodejs.org/docs/latest-v26.x/api/stream.html'
 * module events 'https://nodejs.org/docs/latest-v26.x/api/events.html'
 *
 * TextStream(readable stream.Readable, delimiter string) -> textStream events.EventEmitter
 *
 * textStream.on("data", (text string, encoding string) -> ())
 *
 * textStream.on("end", () -> ())
 * ```
 */
class TextStream extends EventEmitter {
  constructor(readable, delimiter, encoding) {
    super()

    delimiter ??= ""
    encoding ??= "utf8"

    let s = ""
    readable.on('data', (chunk, encoding) => {
      if (typeof chunk == 'string') {
        s += Buffer.from(chunk, encoding).toString(encoding)
      } else {
        s += chunk.toString(encoding)
      }

      let delimiterIndex = s.indexOf(delimiter)
      while (delimiterIndex > -1) {
        const text = s.slice(0, delimiterIndex)
        this.emit("data", text, encoding)
        s = s.slice(delimiterIndex + 1)
        delimiterIndex = s.indexOf(delimiter)
      }
    })

    readable.on('end', () => {
      if (s.length > 0) {
        this.emit("data", s, encoding)
      }
      this.emit("end")
    })
  }
}

module.exports = TextStream
