const package = require("./package.json")
const { spawn } = require("child_process")

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
  const cmd = spawn("node", [`${__dirname}/DatabaseServer.test-2.js`]) // gc
  const exitResult = await new Promise((resolve, reject) => {
    cmd.on("exit", resolve)
  })
  console.log(exitResult)
})
