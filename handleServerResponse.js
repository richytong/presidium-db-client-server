const Readable = require("presidium/Readable")
const TextStream = require("./TextStream")
const BinaryStream = require("./BinaryStream")
const TextEntriesStream = require("./TextEntriesStream")
const BinaryEntriesStream = require("./BinaryEntriesStream")
const AsyncIterator = require("./AsyncIterator")

/**
 * @name handleServerResponse
 *
 * @docs
 * ```specscript
 * module http 'https://nodejs.org/docs/latest-v26.x/api/http.html'
 * module events 'https://nodejs.org/docs/latest-v26.x/api/events.html'
 *
 * handleServerResponse(response http.ServerResponse, options {
 *   textStream: boolean,
 *   binaryStream: boolean,
 *   textEntriesStream: boolean,
 *   binaryEntriesStream: boolean,
 *   delimiter: string,
 *   entryLength: number,
 * }) -> data object|events.EventEmitter
 * ```
 */
async function handleServerResponse(response, options = {}) {
  const {
    textStream,
    binaryStream,
    textEntriesStream,
    binaryEntriesStream,
    delimiter = "",
    entryLength,
  } = options

  const encoding = response.headers["content-encoding"] ?? "utf8"

  if (response.ok) {
    if (textStream) {
      const stream = new TextStream(response, delimiter, encoding)
      return AsyncIterator.fromEvents(stream)
    }
    if (binaryStream) {
      const stream = new BinaryStream(response, delimiter)
      return AsyncIterator.fromEvents(stream)
    }
    if (textEntriesStream) {
      const stream = new TextEntriesStream(response, entryLength, delimiter, encoding)
      return AsyncIterator.fromEvents(stream, "entry")
    }
    if (binaryEntriesStream) {
      const stream = new BinaryEntriesStream(response, entryLength, delimiter, encoding)
      return AsyncIterator.fromEvents(stream, "entry")
    }
    if (response.headers["content-type"] == "application/json") {
      return Readable.JSON(response)
    }
    if (response.headers["content-type"] == "application/octet-stream") {
      return Readable.Buffer(response)
    }
    return Readable.Text(response)
  }
  const message = await Readable.Text(response)
  const error = new Error(message)
  throw error
}

module.exports = handleServerResponse
