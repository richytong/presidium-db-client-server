const assert = require("assert")
const stream = require("stream")
const TextEntriesStream = require("./TextEntriesStream")

async function test0() {
  const delimiter = ","
  const delimitedStream = stream.Readable.from(["a", delimiter, "1", delimiter, "b", delimiter, "2", delimiter, "c", delimiter, "3"])
  const textEntriesStream = new TextEntriesStream(delimitedStream, 2, delimiter, "utf8")
  const entriesArray = []
  let resolve
  const promise = new Promise(_resolve => (resolve = _resolve))
  textEntriesStream.on("entry", entry => {
    entriesArray.push(entry)
  })
  textEntriesStream.on("end", resolve)
  await promise
  assert.equal(entriesArray.length, 3)
  assert.deepEqual(entriesArray[0], ["a", "1"])
  assert.deepEqual(entriesArray[1], ["b", "2"])
  assert.deepEqual(entriesArray[2], ["c", "3"])
}

async function test1() {
  // defaultDelimiter \x1B
  // defaultEncoding utf8
  const delimitedStream = stream.Readable.from(["a1", "b2c3"])
  const textEntriesStream = new TextEntriesStream(delimitedStream, 2)
  const entriesArray = []
  let resolve
  const promise = new Promise(_resolve => (resolve = _resolve))
  textEntriesStream.on("entry", entry => {
    entriesArray.push(entry)
  })
  textEntriesStream.on("end", resolve)
  await promise
  assert.equal(entriesArray.length, 3)
  assert.deepEqual(entriesArray[0], ["a", "1"])
  assert.deepEqual(entriesArray[1], ["b", "2"])
  assert.deepEqual(entriesArray[2], ["c", "3"])
}

async function test2() {
  // defaultDelimiter \x1B
  // defaultEncoding utf8
  const delimitedStream = stream.Readable.from(["a1", "b2c3", "x"])
  const textEntriesStream = new TextEntriesStream(delimitedStream, 2)
  const entriesArray = []
  let resolve
  const promise = new Promise(_resolve => (resolve = _resolve))
  textEntriesStream.on("entry", entry => {
    entriesArray.push(entry)
  })
  const errorsArray = []
  textEntriesStream.on("error", error => {
    errorsArray.push(error)
    resolve()
  })
  await promise
  assert.equal(entriesArray.length, 3)
  assert.deepEqual(entriesArray[0], ["a", "1"])
  assert.deepEqual(entriesArray[1], ["b", "2"])
  assert.deepEqual(entriesArray[2], ["c", "3"])
  assert.equal(errorsArray.length, 1)
  assert.equal(errorsArray[0].name, "Error")
  assert.equal(errorsArray[0].message, "last entry")
  assert.deepEqual(errorsArray[0].entry, ["x"])
}

async function test3() {
  // defaultDelimiter \x1B
  // defaultEncoding utf8
  const delimitedStream = stream.Readable.from(["a1", "b2c3", "", ""])
  const textEntriesStream = new TextEntriesStream(delimitedStream, 2)
  const entriesArray = []
  let resolve
  const promise = new Promise(_resolve => (resolve = _resolve))
  textEntriesStream.on("entry", entry => {
    entriesArray.push(entry)
  })
  textEntriesStream.on("end", resolve)
  await promise
  assert.equal(entriesArray.length, 5)
  assert.deepEqual(entriesArray[0], ["a", "1"])
  assert.deepEqual(entriesArray[1], ["b", "2"])
  assert.deepEqual(entriesArray[2], ["c", "3"])
  assert.deepEqual(entriesArray[3], ["", ""])
  assert.deepEqual(entriesArray[4], ["", ""])
}

async function test4() {
  // defaultDelimiter \x1B
  // defaultEncoding utf8
  const delimitedStream = stream.Readable.from(["a11", "b22c3", "3"])
  const textEntriesStream = new TextEntriesStream(delimitedStream, 3)
  const entriesArray = []
  let resolve
  const promise = new Promise(_resolve => (resolve = _resolve))
  textEntriesStream.on("entry", entry => {
    entriesArray.push(entry)
  })
  textEntriesStream.on("end", resolve)
  await promise
  assert.equal(entriesArray.length, 3)
  assert.deepEqual(entriesArray[0], ["a", "1", "1"])
  assert.deepEqual(entriesArray[1], ["b", "2", "2"])
  assert.deepEqual(entriesArray[2], ["c", "3", "3"])
}

async function test() {
  await test0()
  await test1()
  await test2()
  await test3()
  await test4()
  console.log("Success")
}

if (process.argv[1] == __filename) {
  test()
}

module.exports = test
