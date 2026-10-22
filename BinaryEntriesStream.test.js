const assert = require("assert")
const ArrayEventEmitter = require("./ArrayEventEmitter")
const BinaryEntriesStream = require("./BinaryEntriesStream")

async function test0() {
  const delimiter = ","
  const delimitedStream = ArrayEventEmitter([Buffer.from("a"), Buffer.from(delimiter), Buffer.from("1"), Buffer.from(delimiter), Buffer.from("b"), Buffer.from(delimiter), Buffer.from("2"), Buffer.from(delimiter), Buffer.from("c"), Buffer.from(delimiter), Buffer.from("3")])
  const binaryEntriesStream = new BinaryEntriesStream(delimitedStream, 2, delimiter, "utf8")
  const entriesArray = []
  let resolve
  const promise = new Promise(_resolve => (resolve = _resolve))
  binaryEntriesStream.on("entry", entry => {
    entriesArray.push(entry)
  })
  binaryEntriesStream.on("end", resolve)
  await promise
  assert.equal(entriesArray.length, 3)
  assert(entriesArray[0][0].equals(Buffer.from("a")))
  assert(entriesArray[0][1].equals(Buffer.from("1")))
  assert(entriesArray[1][0].equals(Buffer.from("b")))
  assert(entriesArray[1][1].equals(Buffer.from("2")))
  assert(entriesArray[2][0].equals(Buffer.from("c")))
  assert(entriesArray[2][1].equals(Buffer.from("3")))
}

async function test1() {
  // defaultDelimiter \x1B
  // defaultEncoding utf8
  const delimitedStream = ArrayEventEmitter(["a1", "b2c3"])
  const binaryEntriesStream = new BinaryEntriesStream(delimitedStream, 2)
  const entriesArray = []
  let resolve
  const promise = new Promise(_resolve => (resolve = _resolve))
  binaryEntriesStream.on("entry", entry => {
    entriesArray.push(entry)
  })
  binaryEntriesStream.on("end", resolve)
  await promise
  assert.equal(entriesArray.length, 3)
  assert(entriesArray[0][0].equals(Buffer.from("a")))
  assert(entriesArray[0][1].equals(Buffer.from("1")))
  assert(entriesArray[1][0].equals(Buffer.from("b")))
  assert(entriesArray[1][1].equals(Buffer.from("2")))
  assert(entriesArray[2][0].equals(Buffer.from("c")))
  assert(entriesArray[2][1].equals(Buffer.from("3")))
}

async function test2() {
  // defaultDelimiter \x1B
  // defaultEncoding utf8
  const delimitedStream = ArrayEventEmitter(["a1", "b2c3", "x"])
  const binaryEntriesStream = new BinaryEntriesStream(delimitedStream, 2)
  const entriesArray = []
  let resolve
  const promise = new Promise(_resolve => (resolve = _resolve))
  binaryEntriesStream.on("entry", entry => {
    entriesArray.push(entry)
  })
  const errorsArray = []
  binaryEntriesStream.on("error", error => {
    errorsArray.push(error)
    resolve()
  })
  await promise
  assert.equal(entriesArray.length, 3)
  assert(entriesArray[0][0].equals(Buffer.from("a")))
  assert(entriesArray[0][1].equals(Buffer.from("1")))
  assert(entriesArray[1][0].equals(Buffer.from("b")))
  assert(entriesArray[1][1].equals(Buffer.from("2")))
  assert(entriesArray[2][0].equals(Buffer.from("c")))
  assert(entriesArray[2][1].equals(Buffer.from("3")))
  assert.equal(errorsArray.length, 1)
  assert.equal(errorsArray[0].name, "Error")
  assert.equal(errorsArray[0].message, "last entry")
  assert.deepEqual(errorsArray[0].entry, [Buffer.from("x")])
}

async function test3() {
  // defaultDelimiter \x1B
  // defaultEncoding utf8
  const delimitedStream = ArrayEventEmitter(["a1", "b2c3", "", ""])
  const binaryEntriesStream = new BinaryEntriesStream(delimitedStream, 2)
  const entriesArray = []
  let resolve
  const promise = new Promise(_resolve => (resolve = _resolve))
  binaryEntriesStream.on("entry", entry => {
    entriesArray.push(entry)
  })
  binaryEntriesStream.on("end", resolve)
  await promise
  assert.equal(entriesArray.length, 5)
  assert(entriesArray[0][0].equals(Buffer.from("a")))
  assert(entriesArray[0][1].equals(Buffer.from("1")))
  assert(entriesArray[1][0].equals(Buffer.from("b")))
  assert(entriesArray[1][1].equals(Buffer.from("2")))
  assert(entriesArray[2][0].equals(Buffer.from("c")))
  assert(entriesArray[2][1].equals(Buffer.from("3")))
  assert(entriesArray[3][0].equals(Buffer.from("")))
  assert(entriesArray[3][1].equals(Buffer.from("")))
  assert(entriesArray[4][0].equals(Buffer.from("")))
  assert(entriesArray[4][1].equals(Buffer.from("")))
}

async function test4() {
  // defaultDelimiter \x1B
  // defaultEncoding utf8
  const delimitedStream = ArrayEventEmitter(["a11", "b22c33"])
  const binaryEntriesStream = new BinaryEntriesStream(delimitedStream, 3)
  const entriesArray = []
  let resolve
  const promise = new Promise(_resolve => (resolve = _resolve))
  binaryEntriesStream.on("entry", entry => {
    entriesArray.push(entry)
  })
  binaryEntriesStream.on("end", resolve)
  await promise
  assert.equal(entriesArray.length, 3)
  assert(entriesArray[0][0].equals(Buffer.from("a")))
  assert(entriesArray[0][1].equals(Buffer.from("1")))
  assert(entriesArray[0][2].equals(Buffer.from("1")))
  assert(entriesArray[1][0].equals(Buffer.from("b")))
  assert(entriesArray[1][1].equals(Buffer.from("2")))
  assert(entriesArray[1][2].equals(Buffer.from("2")))
  assert(entriesArray[2][0].equals(Buffer.from("c")))
  assert(entriesArray[2][1].equals(Buffer.from("3")))
  assert(entriesArray[2][2].equals(Buffer.from("3")))
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
