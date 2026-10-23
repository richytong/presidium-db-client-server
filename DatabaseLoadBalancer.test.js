const assert = require("assert")
const fs = require("fs")
const DatabaseLoadBalancer = require("./DatabaseLoadBalancer")
const DatabaseServer = require("./DatabaseServer")
const DiskHashTableClient = require("./DiskHashTableClient")

async function test0() {
  try {
    await fs.promises.rm(`${__dirname}/database`, { recursive: true })
  } catch {
  }

  const server = new DatabaseServer({
    databasePath: `${__dirname}/database`,
  })
  await server.init()

  let resolve1
  const promise1 = new Promise(resolve => (resolve1 = resolve))
  server.listen(7357, resolve1)
  await promise1

  const loadBalancer = new DatabaseLoadBalancer(
    async () => 0,
    { serverIps: ["http://localhost:7357"] }
  )

  let resolve2
  const promise2 = new Promise(resolve => (resolve2 = resolve))
  loadBalancer.listen(6333, resolve2)
  await promise2

  const ht1 = new DiskHashTableClient({
    serverUrl: "http://localhost:6333",
    tableName: "Table1",
  })

  await ht1.set("a", "1")
  await ht1.set("b", "2")
  await ht1.set("c", "3")

  const valueA = await ht1.get("a")
  const valueB = await ht1.get("b")
  const valueC = await ht1.get("c")

  assert.equal(valueA, "1")
  assert.equal(valueB, "2")
  assert.equal(valueC, "3")

  loadBalancer.close()
  server.close()

  assert(loadBalancer.closed)
}

async function test1() {
  try {
    await fs.promises.rm(`${__dirname}/database`, { recursive: true })
  } catch {
  }

  const events = []

  const server1 = new DatabaseServer({
    databasePath: `${__dirname}/database`,
  }, request => {
    events.push({ server: 1, key: request.headers["key"] })
  })
  await server1.init()

  let resolve1
  const promise1 = new Promise(resolve => (resolve1 = resolve))
  server1.listen(7358, resolve1)
  await promise1

  const server2 = new DatabaseServer({
    databasePath: `${__dirname}/database`,
  }, request => {
    events.push({ server: 2, key: request.headers["key"] })
  })
  await server2.init()

  let resolve2
  const promise2 = new Promise(resolve => (resolve2 = resolve))
  server2.listen(7359, resolve2)
  await promise2

  const server3 = new DatabaseServer({
    databasePath: `${__dirname}/database`,
  }, request => {
    events.push({ server: 3, key: request.headers["key"] })
  })
  await server3.init()

  let resolve3
  const promise3 = new Promise(resolve => (resolve3 = resolve))
  server3.listen(7360, resolve3)
  await promise3

  function hash(tableName, key, length) {
    if (length == null) {
      throw new Error("length")
    }
    if (key <= "i") {
      return 0
    }
    if (key <= "r") {
      return 1
    }
    return 2
  }

  let n = 0
  let p = 0

  const loadBalancer = new DatabaseLoadBalancer(hash, {
    serverIps: [
      "http://localhost:7358",
      "http://localhost:7359",
      "http://localhost:7360",
    ],
  }, () => {
    n += 1
  }, () => {
    p = n
  })

  let resolve4
  const promise4 = new Promise(resolve => (resolve4 = resolve))
  loadBalancer.listen(6333, resolve4)
  await promise4

  const ht1 = new DiskHashTableClient({
    serverUrl: "http://localhost:6333",
    tableName: "Table1",
  })

  await ht1.set("a", "1")

  assert.equal(n, 1)
  assert.equal(p, 1)

  await ht1.set("j", "10")

  assert.equal(n, 2)
  assert.equal(p, 2)

  await ht1.set("z", "26")

  assert.equal(n, 3)
  assert.equal(p, 3)

  assert.equal(events.length, 3)
  assert.equal(events[0].server, 1)
  assert.equal(events[0].key, "a")
  assert.equal(events[1].server, 2)
  assert.equal(events[1].key, "j")
  assert.equal(events[2].server, 3)
  assert.equal(events[2].key, "z")

  const valueA = await ht1.get("a")

  assert.equal(n, 4)
  assert.equal(p, 4)

  const valueB = await ht1.get("j")

  assert.equal(n, 5)
  assert.equal(p, 5)

  const valueC = await ht1.get("z")

  assert.equal(n, 6)
  assert.equal(p, 6)

  assert.equal(events.length, 6)
  assert.equal(events[0].server, 1)
  assert.equal(events[0].key, "a")
  assert.equal(events[1].server, 2)
  assert.equal(events[1].key, "j")
  assert.equal(events[2].server, 3)
  assert.equal(events[2].key, "z")
  assert.equal(events[3].server, 1)
  assert.equal(events[3].key, "a")
  assert.equal(events[4].server, 2)
  assert.equal(events[4].key, "j")
  assert.equal(events[5].server, 3)
  assert.equal(events[5].key, "z")

  assert.equal(valueA, "1")
  assert.equal(valueB, "10")
  assert.equal(valueC, "26")

  loadBalancer.close()
  server1.close()
  server2.close()
  server3.close()
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
