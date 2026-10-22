const assert = require("assert")
const stream = require("stream")
const BinaryStream = require("./BinaryStream")

async function test0() {
  const delimiter = ","
  const delimitedStream = stream.Readable.from([Buffer.from("a"), Buffer.from(delimiter), Buffer.from("b"), Buffer.from(delimiter), Buffer.from("c")])
  const binaryStream = new BinaryStream(delimitedStream, delimiter)
  const binaryArray = []
  let resolve
  const promise = new Promise(_resolve => (resolve = _resolve))
  binaryStream.on("data", chunk => {
    binaryArray.push(chunk)
  })
  binaryStream.on("end", resolve)
  await promise
  assert.equal(binaryArray.length, 3)
  assert(binaryArray[0].equals(Buffer.from("a")))
  assert(binaryArray[1].equals(Buffer.from("b")))
  assert(binaryArray[2].equals(Buffer.from("c")))
}

async function test1() {
  // defaultDelimiter \x1B
  const delimitedStream = stream.Readable.from([Buffer.from("a^["), Buffer.from("b^["), Buffer.from(""), Buffer.from("c^[")])
  const binaryStream = new BinaryStream(delimitedStream)
  const binaryArray = []
  let resolve
  const promise = new Promise(_resolve => (resolve = _resolve))
  binaryStream.on("data", chunk => {
    binaryArray.push(chunk)
  })
  binaryStream.on("end", resolve)
  await promise
  assert.equal(binaryArray.length, 3)
  assert(binaryArray[0].equals(Buffer.from("a^[")))
  assert(binaryArray[1].equals(Buffer.from("b^[")))
  assert(binaryArray[2].equals(Buffer.from("c^[")))
}

async function test2() {
  // defaultDelimiter \x1B
  const delimitedStream = stream.Readable.from([Buffer.from("a^["), Buffer.from("b^["), Buffer.from("")])
  const binaryStream = new BinaryStream(delimitedStream)
  const binaryArray = []
  let resolve
  const promise = new Promise(_resolve => (resolve = _resolve))
  binaryStream.on("data", chunk => {
    binaryArray.push(chunk)
  })
  binaryStream.on("end", resolve)
  await promise
  assert.equal(binaryArray.length, 2)
  assert(binaryArray[0].equals(Buffer.from("a^[")))
  assert(binaryArray[1].equals(Buffer.from("b^[")))
}

async function test3() {
  // defaultDelimiter \x1B
  const delimitedStream = stream.Readable.from([Buffer.from("a^["), Buffer.from("b^["), Buffer.from(""), Buffer.from("")])
  const binaryStream = new BinaryStream(delimitedStream)
  const binaryArray = []
  let resolve
  const promise = new Promise(_resolve => (resolve = _resolve))
  binaryStream.on("data", chunk => {
    binaryArray.push(chunk)
  })
  binaryStream.on("end", resolve)
  await promise
  assert.equal(binaryArray.length, 5)
  assert(binaryArray[0].equals(Buffer.from("a^[")))
  assert(binaryArray[1].equals(Buffer.from("b^[")))
  assert(binaryArray[2].equals(Buffer.from("")))
  assert(binaryArray[3].equals(Buffer.from("")))
  assert(binaryArray[4].equals(Buffer.from("")))
}

async function test4() {
  const delimiter = ","
  const delimitedStream = stream.Readable.from(["a", delimiter, "b", delimiter, "c"])
  const binaryStream = new BinaryStream(delimitedStream, delimiter)
  const binaryArray = []
  let resolve
  const promise = new Promise(_resolve => (resolve = _resolve))
  binaryStream.on("data", chunk => {
    binaryArray.push(chunk)
  })
  binaryStream.on("end", resolve)
  await promise
  assert.equal(binaryArray.length, 3)
  assert(binaryArray[0].equals(Buffer.from("a")))
  assert(binaryArray[1].equals(Buffer.from("b")))
  assert(binaryArray[2].equals(Buffer.from("c")))
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
