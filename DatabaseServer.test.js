const assert = require("assert")
const fs = require("fs")
const Readable = require("presidium/Readable")
const DatabaseServer = require("./DatabaseServer")
const DiskHashTableClient = require("./DiskHashTableClient")
const DiskSortedHashTableClient = require("./DiskSortedHashTableClient")

async function test0() {
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

  let resolve1
  const promise1 = new Promise(resolve => (resolve1 = resolve))
  server1.listen(7357, resolve1)
  await promise1

  const ht1 = new DiskHashTableClient({
    serverUrl: "http://localhost:7357",
    tableName: "Table1",
    delimiter: "",
  })

  const count1 = await ht1.count()

  assert.strictEqual(count1, 0)

  await ht1.set("a", "1")
  await ht1.set("b", "2")
  await ht1.set("c", "3")

  const count2 = await ht1.count()

  assert.strictEqual(count2, 3)

  await ht1.clear()

  const count3 = await ht1.count()

  assert.strictEqual(count3, 0)

  await ht1.set("a", "1")
  await ht1.set("b", "2")
  await ht1.set("c", "3")

  const count4 = await ht1.count()

  assert.strictEqual(count4, 3)

  const valueA = await ht1.get("a")
  const valueB = await ht1.get("b")
  const valueC = await ht1.get("c")

  assert.strictEqual(valueA, "1")
  assert.strictEqual(valueB, "2")
  assert.strictEqual(valueC, "3")

  const bufferA = await ht1.getBinary("a")
  const bufferB = await ht1.getBinary("b")
  const bufferC = await ht1.getBinary("c")

  assert(bufferA.equals(Buffer.from("1")))
  assert(bufferB.equals(Buffer.from("2")))
  assert(bufferC.equals(Buffer.from("3")))

  const array1 = []
  for await (const value of await ht1.iterator()) {
    array1.push(value)
  }
  assert.deepEqual(array1, ["3", "2", "1"])

  const array2 = []
  for await (const value of await ht1.iterator({ valueType: "string" })) {
    array2.push(value)
  }
  assert.deepEqual(array2, ["3", "2", "1"])

  const array3 = []
  for await (const value of await ht1.iterator({ valueType: "binary" })) {
    array3.push(value)
  }
  assert.equal(array3.length, 3)
  assert(array3[0].equals(Buffer.from("3")))
  assert(array3[1].equals(Buffer.from("2")))
  assert(array3[2].equals(Buffer.from("1")))

  const array4 = []
  for await (const entry of await ht1.entriesIterator()) {
    array4.push(entry)
  }
  assert.deepEqual(array4, [
    ["c", "3"],
    ["b", "2"],
    ["a", "1"],
  ])

  const array5 = []
  for await (const entry of await ht1.entriesIterator({ valueType: "string" })) {
    array5.push(entry)
  }
  assert.deepEqual(array5, [
    ["c", "3"],
    ["b", "2"],
    ["a", "1"],
  ])

  const array6 = []
  for await (const entry of await ht1.entriesIterator({ valueType: "binary" })) {
    array6.push(entry)
  }
  assert.equal(array6.length, 3)
  assert.equal(array6[0][0], "c")
  assert(array6[0][1].equals(Buffer.from("3")))
  assert.equal(array6[1][0], "b")
  assert(array6[1][1].equals(Buffer.from("2")))
  assert.equal(array6[2][0], "a")
  assert(array6[2][1].equals(Buffer.from("1")))

  const didDeleteA1 = await ht1.delete("a")
  const didDeleteB1 = await ht1.delete("b")
  const didDeleteC1 = await ht1.delete("c")

  assert.strictEqual(didDeleteA1, true)
  assert.strictEqual(didDeleteB1, true)
  assert.strictEqual(didDeleteC1, true)

  const didDeleteA2 = await ht1.delete("a")
  const didDeleteB2 = await ht1.delete("b")
  const didDeleteC2 = await ht1.delete("c")

  assert.strictEqual(didDeleteA2, false)
  assert.strictEqual(didDeleteB2, false)
  assert.strictEqual(didDeleteC2, false)

  assert.strictEqual(await ht1.get("a"), undefined)
  assert.strictEqual(await ht1.get("b"), undefined)
  assert.strictEqual(await ht1.get("c"), undefined)

  await ht1.set("d", "4")

  server1.close()

  const server2 = new DatabaseServer({
    databasePath: `${__dirname}/database`,
    manifestTableName: "Manifest",
    manifestTableInitialLength: 1024,
    manifestTableItemSize: 1024,
    defaultTableInitialLength: 1024,
    defaultTableItemSize: 1024,
    defaultDiskSortedHashTableDegree: 2,
  })
  await server2.init()

  let resolve2
  const promise2 = new Promise(resolve => (resolve2 = resolve))
  server2.listen(7358, resolve2)
  await promise2

  const ht2 = new DiskHashTableClient({
    serverUrl: "http://localhost:7358",
    tableName: "Table1",
  })

  const valueD = await ht2.get("d")
  assert.equal(valueD, "4")

  server2.close()
}

async function test1() {
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

  let resolve1
  const promise1 = new Promise(resolve => (resolve1 = resolve))
  server1.listen(7359, resolve1)
  await promise1

  const ht1 = new DiskSortedHashTableClient({
    serverUrl: "http://localhost:7359",
    tableName: "Table2",
    sortValueType: "number",
    degree: 2,
    delimiter: "",
  })

  const count1 = await ht1.count()

  assert.strictEqual(count1, 0)

  await ht1.set("a", "1", 1)
  await ht1.set("b", "2", 2)
  await ht1.set("c", "3", 3)

  const count2 = await ht1.count()

  assert.strictEqual(count2, 3)

  await ht1.clear()

  const count3 = await ht1.count()

  assert.strictEqual(count3, 0)

  await ht1.set("a", "1", 1)
  await ht1.set("b", "2", 2)
  await ht1.set("c", "3", 3)

  const count4 = await ht1.count()

  assert.strictEqual(count4, 3)

  const valueA = await ht1.get("a")
  const valueB = await ht1.get("b")
  const valueC = await ht1.get("c")

  assert.equal(valueA, "1")
  assert.equal(valueB, "2")
  assert.equal(valueC, "3")

  const bufferA = await ht1.getBinary("a")
  const bufferB = await ht1.getBinary("b")
  const bufferC = await ht1.getBinary("c")

  assert(bufferA.equals(Buffer.from("1")))
  assert(bufferB.equals(Buffer.from("2")))
  assert(bufferC.equals(Buffer.from("3")))

  const array1 = []
  for await (const value of await ht1.forwardIterator()) {
    array1.push(value)
  }
  assert.equal(array1.length, 3)
  assert.equal(array1[0], "1")
  assert.equal(array1[1], "2")
  assert.equal(array1[2], "3")

  const array2 = []
  for await (const value of await ht1.forwardIterator({ valueType: "string" })) {
    array2.push(value)
  }
  assert.equal(array2.length, 3)
  assert.equal(array2[0], "1")
  assert.equal(array2[1], "2")
  assert.equal(array2[2], "3")

  const array3 = []
  for await (const value of await ht1.forwardIterator({ startingSortValue: 2, endingSortValue: 4 })) {
    array3.push(value)
  }
  assert.equal(array3.length, 2)
  assert.equal(array3[0], "2")
  assert.equal(array3[1], "3")

  const array4 = []
  for await (const value of await ht1.forwardIterator({ valueType: "binary" })) {
    array4.push(value)
  }
  assert.equal(array4.length, 3)
  assert(array4[0].equals(Buffer.from("1")))
  assert(array4[1].equals(Buffer.from("2")))
  assert(array4[2].equals(Buffer.from("3")))

  const array5 = []
  for await (const value of await ht1.forwardIterator({ exclusiveStartKey: "a" })) {
    array5.push(value)
  }
  assert.equal(array5.length, 2)
  assert.equal(array5[0], "2")
  assert.equal(array5[1], "3")

  const array6 = []
  for await (const value of await ht1.reverseIterator()) {
    array6.push(value)
  }
  assert.equal(array6.length, 3)
  assert.equal(array6[0], "3")
  assert.equal(array6[1], "2")
  assert.equal(array6[2], "1")

  const array7 = []
  for await (const value of await ht1.reverseIterator({ valueType: "string" })) {
    array7.push(value)
  }
  assert.equal(array7.length, 3)
  assert.equal(array7[0], "3")
  assert.equal(array7[1], "2")
  assert.equal(array7[2], "1")

  const array8 = []
  for await (const value of await ht1.reverseIterator({ startingSortValue: 2, endingSortValue: 0 })) {
    array8.push(value)
  }
  assert.equal(array8.length, 2)
  assert.equal(array8[0], "2")
  assert.equal(array8[1], "1")

  const array9 = []
  for await (const value of await ht1.reverseIterator({ valueType: "binary" })) {
    array9.push(value)
  }
  assert.equal(array9.length, 3)
  assert(array9[0].equals(Buffer.from("3")))
  assert(array9[1].equals(Buffer.from("2")))
  assert(array9[2].equals(Buffer.from("1")))

  const array10 = []
  for await (const value of await ht1.reverseIterator({ exclusiveStartKey: "c" })) {
    array10.push(value)
  }
  assert.equal(array10.length, 2)
  assert.equal(array10[0], "2")
  assert.equal(array10[1], "1")

  const array11 = []
  for await (const value of await ht1.forwardEntriesIterator()) {
    array11.push(value)
  }
  assert.equal(array11.length, 3)
  assert.equal(array11[0][0], "a")
  assert.equal(array11[0][1], "1")
  assert.equal(array11[0][2], 1)
  assert.equal(array11[1][0], "b")
  assert.equal(array11[1][1], "2")
  assert.equal(array11[1][2], 2)
  assert.equal(array11[2][0], "c")
  assert.equal(array11[2][1], "3")
  assert.equal(array11[2][2], 3)

  const array12 = []
  for await (const value of await ht1.forwardEntriesIterator({ valueType: "string" })) {
    array12.push(value)
  }
  assert.equal(array12.length, 3)
  assert.equal(array12[0][0], "a")
  assert.equal(array12[0][1], "1")
  assert.equal(array12[0][2], 1)
  assert.equal(array12[1][0], "b")
  assert.equal(array12[1][1], "2")
  assert.equal(array12[1][2], 2)
  assert.equal(array12[2][0], "c")
  assert.equal(array12[2][1], "3")
  assert.equal(array12[2][2], 3)

  const array13 = []
  for await (const value of await ht1.forwardEntriesIterator({ startingSortValue: 2, endingSortValue: 4 })) {
    array13.push(value)
  }
  assert.equal(array13.length, 2)
  assert.equal(array13[0][0], "b")
  assert.equal(array13[0][1], "2")
  assert.equal(array13[0][2], 2)
  assert.equal(array13[1][0], "c")
  assert.equal(array13[1][1], "3")
  assert.equal(array13[1][2], 3)

  const array14 = []
  for await (const value of await ht1.forwardEntriesIterator({ valueType: "binary" })) {
    array14.push(value)
  }
  assert.equal(array14.length, 3)
  assert.equal(array14[0][0], "a")
  assert(array14[0][1].equals, Buffer.from("1"))
  assert.equal(array14[0][2], 1)
  assert.equal(array14[1][0], "b")
  assert(array14[1][1].equals, Buffer.from("2"))
  assert.equal(array14[1][2], 2)
  assert.equal(array14[2][0], "c")
  assert(array14[2][1].equals, Buffer.from("3"))
  assert.equal(array14[2][2], 3)

  const array15 = []
  for await (const value of await ht1.forwardEntriesIterator({ exclusiveStartKey: "a" })) {
    array15.push(value)
  }
  assert.equal(array15.length, 2)
  assert.equal(array15[0][0], "b")
  assert.equal(array15[0][1], "2")
  assert.equal(array15[0][2], 2)
  assert.equal(array15[1][0], "c")
  assert.equal(array15[1][1], "3")
  assert.equal(array15[1][2], 3)

  const array16 = []
  for await (const value of await ht1.reverseEntriesIterator()) {
    array16.push(value)
  }
  assert.equal(array16.length, 3)
  assert.equal(array16[0][0], "c")
  assert.equal(array16[0][1], "3")
  assert.equal(array16[0][2], 3)
  assert.equal(array16[1][0], "b")
  assert.equal(array16[1][1], "2")
  assert.equal(array16[1][2], 2)
  assert.equal(array16[2][0], "a")
  assert.equal(array16[2][1], "1")
  assert.equal(array16[2][2], 1)

  const array17 = []
  for await (const value of await ht1.reverseEntriesIterator({ valueType: "string" })) {
    array17.push(value)
  }
  assert.equal(array17.length, 3)
  assert.equal(array17[0][0], "c")
  assert.equal(array17[0][1], "3")
  assert.equal(array17[0][2], 3)
  assert.equal(array17[1][0], "b")
  assert.equal(array17[1][1], "2")
  assert.equal(array17[1][2], 2)
  assert.equal(array17[2][0], "a")
  assert.equal(array17[2][1], "1")
  assert.equal(array17[2][2], 1)

  const array18 = []
  for await (const value of await ht1.reverseEntriesIterator({ startingSortValue: 2, endingSortValue: 0 })) {
    array18.push(value)
  }
  assert.equal(array18.length, 2)
  assert.equal(array18[0][0], "b")
  assert.equal(array18[0][1], "2")
  assert.equal(array18[0][2], 2)
  assert.equal(array18[1][0], "a")
  assert.equal(array18[1][1], "1")
  assert.equal(array18[1][2], 1)

  const array19 = []
  for await (const value of await ht1.reverseEntriesIterator({ valueType: "binary" })) {
    array19.push(value)
  }
  assert.equal(array19.length, 3)
  assert.equal(array19[0][0], "c")
  assert(array19[0][1].equals, Buffer.from("3"))
  assert.equal(array19[0][2], 3)
  assert.equal(array19[1][0], "b")
  assert(array19[1][1].equals, Buffer.from("2"))
  assert.equal(array19[1][2], 2)
  assert.equal(array19[2][0], "a")
  assert(array19[2][1].equals, Buffer.from("1"))
  assert.equal(array19[2][2], 1)

  const array20 = []
  for await (const value of await ht1.reverseEntriesIterator({ exclusiveStartKey: "c" })) {
    array20.push(value)
  }
  assert.equal(array20.length, 2)
  assert.equal(array20[0][0], "b")
  assert.equal(array20[0][1], "2")
  assert.equal(array20[0][2], 2)
  assert.equal(array20[1][0], "a")
  assert.equal(array20[1][1], "1")
  assert.equal(array20[1][2], 1)

  const didDeleteA1 = await ht1.delete("a")
  const didDeleteB1 = await ht1.delete("b")
  const didDeleteC1 = await ht1.delete("c")

  assert.strictEqual(didDeleteA1, true)
  assert.strictEqual(didDeleteB1, true)
  assert.strictEqual(didDeleteC1, true)

  const didDeleteA2 = await ht1.delete("a")
  const didDeleteB2 = await ht1.delete("b")
  const didDeleteC2 = await ht1.delete("c")
  
  assert.strictEqual(didDeleteA1, true)
  assert.strictEqual(didDeleteB1, true)
  assert.strictEqual(didDeleteC1, true)

  assert.strictEqual(await ht1.get("a"), undefined)
  assert.strictEqual(await ht1.get("b"), undefined)
  assert.strictEqual(await ht1.get("c"), undefined)

  await ht1.set("d", "4", 4)

  server1.close()

  const server2 = new DatabaseServer({
    databasePath: `${__dirname}/database`,
    manifestTableName: "Manifest",
    manifestTableInitialLength: 1024,
    manifestTableItemSize: 1024,
    defaultTableInitialLength: 1024,
    defaultTableItemSize: 1024,
    defaultDiskSortedHashTableDegree: 2,
  })
  await server2.init()

  let resolve2
  const promise2 = new Promise(resolve => (resolve2 = resolve))
  server2.listen(7360, resolve2)
  await promise2

  const ht2 = new DiskSortedHashTableClient({
    serverUrl: "http://localhost:7360",
    tableName: "Table2",
    sortValueType: "number",
    degree: 2,
  })

  const valueD = await ht2.get("d")
  assert.equal(valueD, "4")

  server2.close()
}

async function test2() {
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

  let resolve1
  const promise1 = new Promise(resolve => (resolve1 = resolve))
  server1.listen(7361, resolve1)
  await promise1

  await server1.registerDiskHashTable("Registered_HashTable1", {
    storagePath: `${__dirname}/database/Registered_HashTable1/storage`,
    headerPath: `${__dirname}/database/Registered_HashTable1/header`,
    initialLength: 1024,
    itemSize: 128,
  })
  assert(server1.hts.has("Registered_HashTable1"))

  const config1Json = await server1.manifestHt.get("Registered_HashTable1")
  const config1 = JSON.parse(config1Json)

  assert.equal(config1.headerPath, `${__dirname}/database/Registered_HashTable1/header`)
  assert.equal(config1.storagePath, `${__dirname}/database/Registered_HashTable1/storage`)
  assert.equal(config1.initialLength, 1024)
  assert.equal(config1.itemSize, 128)

  await server1.registerDiskSortedHashTable("Registered_HashTable2", {
    storagePath: `${__dirname}/database/Registered_HashTable2/storage`,
    headerPath: `${__dirname}/database/Registered_HashTable2/header`,
    initialLength: 2048,
    itemSize: 256,
    sortValueType: "string",
    degree: 3,
  })
  assert(server1.hts.has("Registered_HashTable2"))

  const config2Json = await server1.manifestHt.get("Registered_HashTable2")
  const config2 = JSON.parse(config2Json)

  assert.equal(config2.headerPath, `${__dirname}/database/Registered_HashTable2/header`)
  assert.equal(config2.storagePath, `${__dirname}/database/Registered_HashTable2/storage`)
  assert.equal(config2.initialLength, 2048)
  assert.equal(config2.itemSize, 256)
  assert.equal(config2.sortValueType, "string")
  assert.equal(config2.degree, 3)

  const ht1 = new DiskHashTableClient({
    serverUrl: "http://localhost:7361",
    tableName: "Table3",
  })

  const response1 = await ht1.http.POST(`/${this.tableName}/x`, {
    headers: {
      "Client-Name": "Unknown",
    },
  })
  assert.equal(response1.status, 403)
  const message1 = await Readable.Text(response1)
  assert.equal(message1, "Forbidden: Client-Name")

  const response2 = await ht1.http.POST(`/${this.tableName}/x`, {
    headers: {
      "Client-Name": "DiskHashTableClient",
    },
  })
  assert.equal(response2.status, 403)
  const message2 = await Readable.Text(response2)
  assert.equal(message2, "Forbidden: Hash Table Method")

  server1.close()

  const server2 = new DatabaseServer({
    databasePath: `${__dirname}/database`,
    manifestTableName: "Manifest",
    manifestTableInitialLength: 1024,
    manifestTableItemSize: 1024,
    defaultTableInitialLength: 1024,
    defaultTableItemSize: 1024,
    defaultDiskSortedHashTableDegree: 2,
  })
  await server2.init()

  let resolve2
  const promise2 = new Promise(resolve => (resolve2 = resolve))
  server2.listen(7362, resolve2)
  await promise2

  const ht2 = new DiskHashTableClient({
    serverUrl: "http://localhost:7362",
    tableName: "Table3",
  })

  const response3 = await ht2.http.POST(`/${this.tableName}/x`, {
    headers: {
      "Client-Name": "Unknown",
    },
  })
  assert.equal(response3.status, 403)
  const message3 = await Readable.Text(response3)
  assert.equal(message3, "Forbidden: Client-Name")

  const response4 = await ht2.http.POST(`/${this.tableName}/x/x`, {
    headers: {
      "Client-Name": "Unknown",
    },
  })
  assert.equal(response4.status, 404)
  const message4 = await Readable.Text(response4)
  assert.equal(message4, "Not Found")

  Readable.JSON = () => {
    throw new Error("Test Error")
  }

  await assert.rejects(() => ht2.get("a"), new Error("Test Error"))

  server2.close()
}

async function test() {
  await test0()
  await test1()
  await test2()
  console.log("Success")
}

if (process.argv[1] == __filename) {
  test()
}

module.exports = test
