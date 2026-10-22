const assert = require("assert")
const AsyncIterator = require("./AsyncIterator")
const TextEntriesStream = require("./TextEntriesStream")
const ArrayEventEmitter = require("./ArrayEventEmitter")

async function test0() {
  const emitter = ArrayEventEmitter(["a", "b", "c"])
  const asyncIterator = AsyncIterator.fromEvents(emitter)
  const array = []
  for await (const s of asyncIterator) {
    array.push(s)
  }
  assert.equal(array.length, 3)
  assert.equal(array[0], "a")
  assert.equal(array[1], "b")
  assert.equal(array[2], "c")
}

async function test1() {
  const emitter = ArrayEventEmitter(["a", "", "1", "", "b", "", "2", "", "c", "", "3"])
  const textEntriesEmitter = new TextEntriesStream(emitter, 2)
  const asyncIterator = AsyncIterator.fromEvents(textEntriesEmitter, "entry")
  const array = []
  for await (const entry of asyncIterator) {
    array.push(entry)
  }
  assert.equal(array.length, 3)
  assert.equal(array[0][0], "a")
  assert.equal(array[0][1], "1")
  assert.equal(array[1][0], "b")
  assert.equal(array[1][1], "2")
  assert.equal(array[2][0], "c")
  assert.equal(array[2][1], "3")
}

async function test() {
  await test0()
  await test1()
  console.log("Success")
}

if (process.argv[1] == __filename) {
  test()
}

module.exports = test
