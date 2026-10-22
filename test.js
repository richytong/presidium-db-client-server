const tests = [
  require("./AsyncIterator.test.js"),
  require("./BinaryEntriesStream.test.js"),
  require("./BinaryStream.test.js"),
  require("./TextEntriesStream.test.js"),
  require("./TextStream.test.js"),
  require("./DatabaseServer.test.js"),
]

setImmediate(async () => {
  for (const test of tests) {
    await test()
  }
})
