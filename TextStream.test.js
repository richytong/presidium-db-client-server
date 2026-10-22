const assert = require("assert")
const stream = require("stream")
const TextStream = require("./TextStream")

async function test0() {
  const delimiter = ","
  const delimitedStream = stream.Readable.from(["a", delimiter, "b", delimiter, "c"])
  const textStream = new TextStream(delimitedStream, delimiter, "utf8")
  const textArray = []
  let resolve
  const promise = new Promise(_resolve => (resolve = _resolve))
  textStream.on("data", text => {
    textArray.push(text)
  })
  textStream.on("end", resolve)
  await promise
  assert.equal(textArray.length, 3)
  assert.equal(textArray[0], "a")
  assert.equal(textArray[1], "b")
  assert.equal(textArray[2], "c")
}

async function test1() {
  // defaultDelimiter \x1B
  // defaultEncoding utf8
  const delimitedStream = stream.Readable.from(["a^[", "b^[", "", "c^["])
  const textStream = new TextStream(delimitedStream)
  const textArray = []
  let resolve
  const promise = new Promise(_resolve => (resolve = _resolve))
  textStream.on("data", text => {
    textArray.push(text)
  })
  textStream.on("end", resolve)
  await promise
  assert.equal(textArray.length, 3)
  assert.equal(textArray[0], "a^[")
  assert.equal(textArray[1], "b^[")
  assert.equal(textArray[2], "c^[")
}

async function test2() {
  // defaultDelimiter \x1B
  // defaultEncoding utf8
  const delimitedStream = stream.Readable.from(["a^[", "b^[", ""])
  const textStream = new TextStream(delimitedStream)
  const textArray = []
  let resolve
  const promise = new Promise(_resolve => (resolve = _resolve))
  textStream.on("data", text => {
    textArray.push(text)
  })
  textStream.on("end", resolve)
  await promise
  assert.equal(textArray.length, 2)
  assert.equal(textArray[0], "a^[")
  assert.equal(textArray[1], "b^[")
}

async function test3() {
  // defaultDelimiter \x1B
  // defaultEncoding utf8
  const delimitedStream = stream.Readable.from(["a^[", "b^[", "", ""])
  const textStream = new TextStream(delimitedStream)
  const textArray = []
  let resolve
  const promise = new Promise(_resolve => (resolve = _resolve))
  textStream.on("data", text => {
    textArray.push(text)
  })
  textStream.on("end", resolve)
  await promise
  assert.equal(textArray.length, 5)
  assert.equal(textArray[0], "a^[")
  assert.equal(textArray[1], "b^[")
  assert.equal(textArray[2], "")
  assert.equal(textArray[3], "")
  assert.equal(textArray[4], "")
}

async function test() {
  await test0()
  await test1()
  await test2()
  await test3()
  console.log("Success")
}

if (process.argv[1] == __filename) {
  test()
}

module.exports = test
