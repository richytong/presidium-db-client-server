const package = require("./package.json")
const walk = require("./walk")

const tests = [
  require("./AsyncIterator.test.js"),
  require("./BinaryEntriesStream.test.js"),
  require("./BinaryStream.test.js"),
  require("./TextEntriesStream.test.js"),
  require("./TextStream.test.js"),
  require("./DatabaseServer.test.js"),
  require("./DatabaseLoadBalancer.test.js"),
]

setImmediate(async () => {
  for (const test of tests) {
    await test()
  }
})
