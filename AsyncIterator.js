const AsyncIterator = {}

function sleep(time) {
  return new Promise(resolve => setTimeout(resolve, time))
}

/**
 * @name fromEvents
 *
 * @docs
 * ```specscript
 * module EventEmitter "./specscript/EventEmitter.ss"
 *
 * fromEvents(events EventEmitter) -> AsyncIterator
 * fromEvents(events EventEmitter, dataEventName string) -> AsyncIterator
 * ```
 */
async function* fromEvents(events, dataEventName = "data") {
  let buffer = []
  events.on(dataEventName, data => buffer.push(data))
  let streaming = true
  events.on("end", () => (streaming = false))
  while (streaming || buffer.length > 0) {
    while (buffer.length > 0) {
      yield* buffer
      buffer = []
    }
    await sleep(1)
  }
}

AsyncIterator.fromEvents = fromEvents

module.exports = AsyncIterator
