const assert = require("assert")
const fs = require("fs")
const Readable = require("presidium/Readable")
const DatabaseServer = require("./DatabaseServer")
const DiskHashTableClient = require("./DiskHashTableClient")
const DiskSortedHashTableClient = require("./DiskSortedHashTableClient")

async function test5() {
  try {
    await fs.promises.rm(`${__dirname}/database`, { recursive: true })
  } catch {
  }

  const server1 = new DatabaseServer({
    databasePath: `${__dirname}/database`,
    manifestTableName: "Manifest",
    manifestTableInitialLength: 1024,
    manifestTableItemSize: 1024,
    defaultTableInitialLength: 1024,
    defaultTableItemSize: 1024,
    defaultDiskSortedHashTableDegree: 2,
    resizeFactor: 4,
    resizeRatio: 0,
    delimiter: "",
  })
  await server1.init()

  server1.listen(7363)

  const ht1 = new DiskHashTableClient({
    serverUrl: "http://localhost:7363",
    tableName: "ClientRegisteredTable1",
    initialLength: 1024,
    itemSize: 1024,
    resizeRatio: 0,
    resizeFactor: 4,
    delimiter: "",
  })

  await ht1.register()

  await server1.server.close()
}

async function test6() {
  try {
    await fs.promises.rm(`${__dirname}/database`, { recursive: true })
  } catch {
  }

  const server1 = new DatabaseServer({
    databasePath: `${__dirname}/database`,
    manifestTableName: "Manifest",
    manifestTableInitialLength: 1024,
    manifestTableItemSize: 1024,
    defaultTableInitialLength: 1024,
    defaultTableItemSize: 1024,
    defaultDiskSortedHashTableDegree: 2,
  })
  await server1.init()

  server1.listen(7364)

  const ht1 = new DiskSortedHashTableClient({
    serverUrl: "http://localhost:7364",
    initialLength: 1024,
    itemSize: 1024,
    tableName: "ClientRegisteredTable2",
    sortValueType: "number",
    degree: 2,
    resizeFactor: 4,
    resizeRatio: 0,
    delimiter: "",
  })

  await ht1.register()

  await server1.server.close()
}
async function test7() {
  try {
    await fs.promises.rm(`${__dirname}/database`, { recursive: true })
  } catch {
  }

  const server1 = new DatabaseServer({
    databasePath: `${__dirname}/database`,
    manifestTableName: "Manifest",
    manifestTableInitialLength: 1024,
    manifestTableItemSize: 1024,
    defaultTableInitialLength: 1024,
    defaultTableItemSize: 1024,
    defaultDiskSortedHashTableDegree: 2,
  })
  await server1.init()

  server1.listen(7365)

  const ht1 = new DiskSortedHashTableClient({
    serverUrl: "http://localhost:7365",
    initialLength: 1024,
    itemSize: 1024,
    tableName: "ClientRegisteredTable2",
    sortValueType: "number",
    degree: 2,
    resizeFactor: 4,
    resizeRatio: 0,
    delimiter: "",
  })

  const config = {
    initialLength: ht1.initialLength,
    itemSize: ht1.itemSize,
    sortValueType: ht1.sortValueType,
    degree: ht1.degree,
    resizeRatio: ht1.resizeRatio,
    resizeFactor: ht1.resizeFactor,
  }

  const response = await ht1.http.POST(`/${ht1.tableName}/register`, {
    headers: {
      "Content-Type": "application/json",
      "Client-Name": "Unknown",
    },
    body: JSON.stringify(config),
  })
  const message = await Readable.Text(response)
  assert.equal(message, "Forbidden: Client-Name")
  assert.equal(response.status, 403)

  server1.close()
}

async function test() {
  await test5()
  await test6()
  await test7()
  console.log("Success")
}

if (process.argv[1] == __filename) {
  test()
}

module.exports = test
