const EventEmitter = require("events")

/**
 * @name BinaryEntriesStream
 *
 * @docs
 * ```coffeescript [specscript]
 * module stream 'https://nodejs.org/docs/latest-v26.x/api/stream.html'
 * module events 'https://nodejs.org/docs/latest-v26.x/api/events.html'
 *
 * BinaryEntriesStream(
 *   readable stream.Readable,
 *   entryLength number,
 *   delimiter string
 * ) -> binaryEntriesStream events.EventEmitter
 *
 * binaryEntriesStream.on("entry", (entry Array<Buffer>, keyEncoding string) -> ())
 *
 * binaryEntriesStream.on("end", () -> ())
 * ```
 */
class BinaryEntriesStream extends EventEmitter {
  constructor(readable, entryLength, delimiter, encoding) {
    super()

    delimiter ??= ""
    encoding ??= "utf8"

    let buffer = Buffer.from("")
    let entry = []

    readable.on('data', (chunk, encoding) => {
      if (typeof chunk == 'string') {
        buffer = Buffer.concat([buffer, Buffer.from(chunk, encoding)])
      } else {
        buffer = Buffer.concat([buffer, chunk])
      }

      let delimiterIndex = buffer.indexOf(delimiter)
      while (delimiterIndex > -1) {
        const slice = buffer.slice(0, delimiterIndex)
        entry.push(slice)
        if (entry.length == entryLength) {
          this.emit("entry", entry, encoding)
          entry = []
        }
        buffer = buffer.slice(delimiterIndex + 1)
        delimiterIndex = buffer.indexOf(delimiter)
      }
    })

    readable.on('end', () => {
      if (buffer.length > 0) {
        entry.push(buffer)
      }
      if (entry.length == entryLength) {
        this.emit("entry", entry, encoding)
        this.emit("end")
        entry = []
      } else if (entry.length > 0) {
        const error = new Error("last entry")
        error.entry = entry
        this.emit("error", error)
      } else {
        this.emit("end")
      }
    })
  }
}

module.exports = BinaryEntriesStream
