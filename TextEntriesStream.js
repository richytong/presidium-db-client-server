const EventEmitter = require("events")

/**
 * @name TextEntriesStream
 *
 * @docs
 * ```coffeescript [specscript]
 * module EventEmitter "./specscript/EventEmitter.ss"
 *
 * TextEntriesStream(
 *   readable stream.Readable,
 *   entryLength number,
 *   delimiter string
 * ) -> textEntriesStream EventEmitter
 *
 * textEntriesStream.on("entry", (entry Array<string>, keyEncoding string) -> ())
 *
 * textEntriesStream.on("end", () -> ())
 * ```
 */
class TextEntriesStream extends EventEmitter {
  constructor(readable, entryLength, delimiter, encoding) {
    super()

    delimiter ??= ""
    encoding ??= "utf8"

    let s = ""
    let entry = []
    readable.on('data', (chunk, encoding) => {
      if (typeof chunk == 'string') {
        s += Buffer.from(chunk, encoding).toString(encoding)
      } else {
        s += chunk.toString(encoding)
      }

      let delimiterIndex = s.indexOf(delimiter)
      while (delimiterIndex > -1) {
        const text = s.slice(0, delimiterIndex)
        entry.push(text)
        if (entry.length == entryLength) {
          this.emit("entry", entry, encoding)
          entry = []
        }
        s = s.slice(delimiterIndex + 1)
        delimiterIndex = s.indexOf(delimiter)
      }
    })

    readable.on("end", () => {
      if (s.length > 0) {
        entry.push(s)
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

module.exports = TextEntriesStream
