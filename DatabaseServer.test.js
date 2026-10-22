const assert = require("assert")
const fs = require("fs")
const DatabaseServer = require("./DatabaseServer")
const DiskHashTableClient = require("./DiskHashTableClient")
const DiskSortedHashTableClient = require("./DiskSortedHashTableClient")

async function test0() {
  try {
    await fs.promises.rm(`${__dirname}/database`, { recursive: true })
  } catch {
  }

  const server = new DatabaseServer({
    databasePath: `${__dirname}/database`,
    manifestTableName: "Manifest",
    manifestTableInitialLength: 1024,
    manifestTableItemSize: 1024,
    defaultTableInitialLength: 1024,
    defaultTableItemSize: 1024,
    defaultDiskSortedHashTableDegree: 2,
  })
  await server.init()

  let resolve1
  const promise1 = new Promise(resolve => (resolve1 = resolve))
  server.listen(7357, resolve1)
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

  server.close()
}

async function test1() {
  try {
    await fs.promises.rm(`${__dirname}/database`, { recursive: true })
  } catch {
  }

  const server = new DatabaseServer({
    databasePath: `${__dirname}/database`,
    manifestTableName: "Manifest",
    manifestTableInitialLength: 1024,
    manifestTableItemSize: 1024,
    defaultTableInitialLength: 1024,
    defaultTableItemSize: 1024,
    defaultDiskSortedHashTableDegree: 2,
  })
  await server.init()

  let resolve1
  const promise1 = new Promise(resolve => (resolve1 = resolve))
  server.listen(7358, resolve1)
  await promise1

  const ht2 = new DiskSortedHashTableClient({
    serverUrl: "http://localhost:7358",
    tableName: "Table2",
    sortValueType: "number",
    degree: 2,
    delimiter: "",
  })

  const count1 = await ht2.count()

  assert.strictEqual(count1, 0)

  await ht2.set("a", "1", 1)
  await ht2.set("b", "2", 2)
  await ht2.set("c", "3", 3)

  const count2 = await ht2.count()

  assert.strictEqual(count2, 3)

  await ht2.clear()

  const count3 = await ht2.count()

  assert.strictEqual(count3, 0)

  await ht2.set("a", "1", 1)
  await ht2.set("b", "2", 2)
  await ht2.set("c", "3", 3)

  const count4 = await ht2.count()

  assert.strictEqual(count4, 3)

  const valueA = await ht2.get("a")
  const valueB = await ht2.get("b")
  const valueC = await ht2.get("c")

  assert.equal(valueA, "1")
  assert.equal(valueB, "2")
  assert.equal(valueC, "3")

  const bufferA = await ht2.getBinary("a")
  const bufferB = await ht2.getBinary("b")
  const bufferC = await ht2.getBinary("c")

  assert(bufferA.equals(Buffer.from("1")))
  assert(bufferB.equals(Buffer.from("2")))
  assert(bufferC.equals(Buffer.from("3")))

  const array1 = []
  for await (const value of await ht2.forwardIterator()) {
    array1.push(value)
  }
  assert.equal(array1.length, 3)
  assert.equal(array1[0], "1")
  assert.equal(array1[1], "2")
  assert.equal(array1[2], "3")

  const array2 = []
  for await (const value of await ht2.forwardIterator({ valueType: "string" })) {
    array2.push(value)
  }
  assert.equal(array2.length, 3)
  assert.equal(array2[0], "1")
  assert.equal(array2[1], "2")
  assert.equal(array2[2], "3")

  const array3 = []
  for await (const value of await ht2.forwardIterator({ startingSortValue: 2, endingSortValue: 4 })) {
    array3.push(value)
  }
  assert.equal(array3.length, 2)
  assert.equal(array3[0], "2")
  assert.equal(array3[1], "3")

  const array4 = []
  for await (const value of await ht2.forwardIterator({ valueType: "binary" })) {
    array4.push(value)
  }
  assert.equal(array4.length, 3)
  assert(array4[0].equals(Buffer.from("1")))
  assert(array4[1].equals(Buffer.from("2")))
  assert(array4[2].equals(Buffer.from("3")))

  const array5 = []
  for await (const value of await ht2.forwardIterator({ exclusiveStartKey: "a" })) {
    array5.push(value)
  }
  assert.equal(array5.length, 2)
  assert.equal(array5[0], "2")
  assert.equal(array5[1], "3")

  const array6 = []
  for await (const value of await ht2.reverseIterator()) {
    array6.push(value)
  }
  assert.equal(array6.length, 3)
  assert.equal(array6[0], "3")
  assert.equal(array6[1], "2")
  assert.equal(array6[2], "1")

  const array7 = []
  for await (const value of await ht2.reverseIterator({ valueType: "string" })) {
    array7.push(value)
  }
  assert.equal(array7.length, 3)
  assert.equal(array7[0], "3")
  assert.equal(array7[1], "2")
  assert.equal(array7[2], "1")

  const array8 = []
  for await (const value of await ht2.reverseIterator({ startingSortValue: 2, endingSortValue: 0 })) {
    array8.push(value)
  }
  assert.equal(array8.length, 2)
  assert.equal(array8[0], "2")
  assert.equal(array8[1], "1")

  const array9 = []
  for await (const value of await ht2.reverseIterator({ valueType: "binary" })) {
    array9.push(value)
  }
  assert.equal(array9.length, 3)
  assert(array9[0].equals(Buffer.from("3")))
  assert(array9[1].equals(Buffer.from("2")))
  assert(array9[2].equals(Buffer.from("1")))

  const array10 = []
  for await (const value of await ht2.reverseIterator({ exclusiveStartKey: "c" })) {
    array10.push(value)
  }
  assert.equal(array10.length, 2)
  assert.equal(array10[0], "2")
  assert.equal(array10[1], "1")

  const array11 = []
  for await (const value of await ht2.forwardEntriesIterator()) {
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
  for await (const value of await ht2.forwardEntriesIterator({ valueType: "string" })) {
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
  for await (const value of await ht2.forwardEntriesIterator({ startingSortValue: 2, endingSortValue: 4 })) {
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
  for await (const value of await ht2.forwardEntriesIterator({ valueType: "binary" })) {
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
  for await (const value of await ht2.forwardEntriesIterator({ exclusiveStartKey: "a" })) {
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
  for await (const value of await ht2.reverseEntriesIterator()) {
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
  for await (const value of await ht2.reverseEntriesIterator({ valueType: "string" })) {
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
  for await (const value of await ht2.reverseEntriesIterator({ startingSortValue: 2, endingSortValue: 0 })) {
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
  for await (const value of await ht2.reverseEntriesIterator({ valueType: "binary" })) {
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
  for await (const value of await ht2.reverseEntriesIterator({ exclusiveStartKey: "c" })) {
    array20.push(value)
  }
  assert.equal(array20.length, 2)
  assert.equal(array20[0][0], "b")
  assert.equal(array20[0][1], "2")
  assert.equal(array20[0][2], 2)
  assert.equal(array20[1][0], "a")
  assert.equal(array20[1][1], "1")
  assert.equal(array20[1][2], 1)

  const didDeleteA1 = await ht2.delete("a")
  const didDeleteB1 = await ht2.delete("b")
  const didDeleteC1 = await ht2.delete("c")

  assert.strictEqual(didDeleteA1, true)
  assert.strictEqual(didDeleteB1, true)
  assert.strictEqual(didDeleteC1, true)

  const didDeleteA2 = await ht2.delete("a")
  const didDeleteB2 = await ht2.delete("b")
  const didDeleteC2 = await ht2.delete("c")
  
  assert.strictEqual(didDeleteA1, true)
  assert.strictEqual(didDeleteB1, true)
  assert.strictEqual(didDeleteC1, true)

  assert.strictEqual(await ht2.get("a"), undefined)
  assert.strictEqual(await ht2.get("b"), undefined)
  assert.strictEqual(await ht2.get("c"), undefined)

  server.close()
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
