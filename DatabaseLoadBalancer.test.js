const assert = require("assert")
const fs = require("fs")
const http = require("http")
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

  server.listen(7357)

  const loadBalancer = new DatabaseLoadBalancer(
    async () => 0,
    { serverIps: ["http://localhost:7357"] }
  )

  loadBalancer.listen(6333)

  const ht1 = new DiskHashTableClient({
    serverUrl: "http://localhost:6333",
    tableName: "Table1",
    initialLength: 1024,
    itemSize: 1024,
  })
  await ht1.register()

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

  server1.listen(7358)

  const server2 = new DatabaseServer({
    databasePath: `${__dirname}/database`,
  }, request => {
    events.push({ server: 2, key: request.headers["key"] })
  })

  server2.listen(7359)

  const server3 = new DatabaseServer({
    databasePath: `${__dirname}/database`,
  }, request => {
    events.push({ server: 3, key: request.headers["key"] })
  })

  server3.listen(7360)

  function hash(tableName, key, length) {
    if (length == null) {
      throw new Error("length")
    }
    if (tableName <= "i") {
      return 0
    }
    if (tableName <= "r") {
      return 1
    }
    return 2
  }

  let n = 0
  let p = 0

  const loadBalancer = new DatabaseLoadBalancer(hash, {
    serverIps: [
      "localhost:7358",
      "localhost:7359",
      "localhost:7360",
    ],
  }, () => {
    n += 1
  }, () => {
    p = n
  })

  loadBalancer.listen(6333)

  const ht1 = new DiskHashTableClient({
    serverUrl: "http://localhost:6333",
    tableName: "a",
    initialLength: 1024,
    itemSize: 1024,
  })
  await ht1.register()
  assert.equal(n, 1)
  assert.equal(p, 1)

  await ht1.set("a", "1")

  assert.equal(n, 2)
  assert.equal(p, 2)

  assert.equal(events.length, 2)
  assert.equal(events[0].server, 1)
  assert.equal(events[1].server, 1)
  assert.equal(events[1].key, "a")

  const ht2 = new DiskHashTableClient({
    serverUrl: "http://localhost:6333",
    tableName: "j",
    initialLength: 1024,
    itemSize: 1024,
  })
  await ht2.register()

  assert.equal(n, 3)
  assert.equal(p, 3)

  await ht2.set("j", "10")

  assert.equal(n, 4)
  assert.equal(p, 4)

  assert.equal(events.length, 4)
  assert.equal(events[2].server, 2)
  assert.equal(events[3].server, 2)
  assert.equal(events[3].key, "j")

  const ht3 = new DiskHashTableClient({
    serverUrl: "http://localhost:6333",
    tableName: "z",
    initialLength: 1024,
    itemSize: 1024,
  })
  await ht3.register()

  assert.equal(n, 5)
  assert.equal(p, 5)

  await ht3.set("z", "26")

  assert.equal(n, 6)
  assert.equal(p, 6)

  assert.equal(events.length, 6)
  assert.equal(events[4].server, 3)
  assert.equal(events[4].server, 3)
  assert.equal(events[5].key, "z")

  const valueA = await ht1.get("a")

  assert.equal(n, 7)
  assert.equal(p, 7)

  const valueB = await ht2.get("j")

  assert.equal(n, 8)
  assert.equal(p, 8)

  const valueC = await ht3.get("z")

  assert.equal(n, 9)
  assert.equal(p, 9)

  assert.equal(events.length, 9)
  assert.equal(events[6].server, 1)
  assert.equal(events[7].server, 2)
  assert.equal(events[8].server, 3)

  assert.equal(valueA, "1")
  assert.equal(valueB, "10")
  assert.equal(valueC, "26")

  loadBalancer.close()
  server1.close()
  server2.close()
  server3.close()
}

async function test2() {
  try {
    await fs.promises.rm(`${__dirname}/database`, { recursive: true })
  } catch {
  }

  const server1 = new DatabaseServer({
    databasePath: `${__dirname}/database`,
  })

  server1.listen(7361)

  const server2 = new DatabaseServer({
    databasePath: `${__dirname}/database`,
  })

  server2.listen(7362)

  const server3 = new DatabaseServer({
    databasePath: `${__dirname}/database`,
  })

  server3.listen(7363)

  const loadBalancer = new DatabaseLoadBalancer({
    serverIps: [[
      "localhost:7361",
      "localhost:7362",
      "localhost:7363",
    ]],
  })

  loadBalancer.listen(6334)

  const ht1 = new DiskHashTableClient({
    serverUrl: "http://localhost:6334",
    tableName: "Table1",
    initialLength: 1024,
    itemSize: 1024,
  })
  await ht1.register()

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
  server1.close()
  server2.close()
  server3.close()
}

async function test3() {
  try {
    await fs.promises.rm(`${__dirname}/database`, { recursive: true })
  } catch {
  }

  const server1 = new DatabaseServer({
    databasePath: `${__dirname}/database`,
  })

  server1.listen(7364)

  const server2 = new DatabaseServer({
    databasePath: `${__dirname}/database`,
  })

  server2.listen(7365)

  const server3 = http.createServer((request, response) => {
    response.writeHead(500, {
      "Content-Type": "text/plain",
    })
    response.end("Test Internal Server Error")
  })

  server3.listen(7366)

  const loadBalancer = new DatabaseLoadBalancer({
    serverIps: [[
      "localhost:7364",
      "localhost:7365",
      "localhost:7366",
    ]],
  })

  loadBalancer.listen(6335)

  const ht1 = new DiskHashTableClient({
    serverUrl: "http://localhost:6335",
    tableName: "Table1",
    initialLength: 1024,
    itemSize: 1024,
  })
  await ht1.register()

  consoleError = console.error
  const errors = []
  console.error = error => {
    errors.push(error)
  }

  await ht1.set("a", "1")

  assert.equal(errors.length, 1)
  assert.equal(errors[0].message, "Test Internal Server Error")

  await ht1.set("b", "2")

  assert.equal(errors.length, 2)
  assert.equal(errors[0].message, "Test Internal Server Error")
  assert.equal(errors[1].message, "Test Internal Server Error")

  console.error = consoleError

  loadBalancer.close()
  server1.close()
  server2.close()
  server3.close()
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
