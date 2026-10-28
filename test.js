const fs = require("fs")
const package = require("./package.json")
const walk = require("./walk")

async function moduleTest() {
  try {
    await fs.promises.rm(`${__dirname}/tmp`, { recursive: true })
  } catch {
  }
  const tmp = await fs.promises.mkdir(`${__dirname}/tmp`)
  for (const filename of package.files) {
    await fs.promises.writeFile(
      `${__dirname}/tmp/${filename}`,
      await fs.promises.readFile(`${__dirname}/${filename}`)
    )
  }
  for (const filename of package.files) {
    require(`./tmp/${filename}`)
  }
  await fs.promises.rm(`${__dirname}/tmp`, { recursive: true })
  console.log("Success")
}

const tests = [
  moduleTest,
  require("./AsyncIterator.test.js"),
  require("./BinaryEntriesStream.test.js"),
  require("./BinaryStream.test.js"),
  require("./TextEntriesStream.test.js"),
  require("./TextStream.test.js"),
  require("./DatabaseServer.test.js"),
  // require("./DatabaseLoadBalancer.test.js"),
]

setImmediate(async () => {
  for (const test of tests) {
    await test()
  }
})
