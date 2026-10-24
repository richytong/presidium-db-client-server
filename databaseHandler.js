/**
 * Presidium DB Client and Server may be freely distributed under the CFOSS license.
 */

require("rubico/global")
const DiskHashTable = require("presidium/DiskHashTable")
const DiskSortedHashTable = require("presidium/DiskSortedHashTable")
const Readable = require("presidium/Readable")

/**
 * @name getHt
 *
 * @docs
 * ```specscript
 * module HTTP "https://presidium.services/docs/HTTP"
 *
 * getHt(tableName string, request HTTP.Request) -> ht DiskHashTable|DiskSortedHashTable
 * ```
 */
async function getHt(tableName, request) {
  const {
    databasePath,
    defaultTableInitialLength,
    defaultTableItemSize,
    manifestHt,
    hts,
  } = this

  const htConfigString = await manifestHt.get(tableName)
  let ht
  if (htConfigString) {
    const config = JSON.parse(htConfigString)
    if (request.headers["client-name"] == "DiskHashTableClient") {
      ht = new DiskHashTable(config)
      await ht.init()
      hts.set(tableName, ht)
    } else if (request.headers["client-name"] == "DiskSortedHashTableClient") {
      ht = new DiskSortedHashTable(config)
      await ht.init()
      hts.set(tableName, ht)
    } else {
      const error = new Error("Forbidden: Client-Name")
      error.code = 403
      throw error
    }
  } else {
    if (request.headers["client-name"] == "DiskHashTableClient") {
      const config = {
        storagePath: `${databasePath}/${tableName}/storage`,
        headerPath: `${databasePath}/${tableName}/header`,
        initialLength: defaultTableInitialLength,
        itemSize: defaultTableItemSize,
      }
      ht = new DiskHashTable(config)
      await manifestHt.set(tableName, JSON.stringify(config))
      await ht.init()
      hts.set(tableName, ht)
    } else if (request.headers["client-name"] == "DiskSortedHashTableClient") {
      const config = {
        storagePath: `${databasePath}/${tableName}/storage`,
        headerPath: `${databasePath}/${tableName}/header`,
        initialLength: defaultTableInitialLength,
        itemSize: defaultTableItemSize,
        sortValueType: request.headers["sort-value-type"],
        degree: Number(request.headers["degree"]),
      }
      ht = new DiskSortedHashTable(config)
      await manifestHt.set(tableName, JSON.stringify(config))
      await ht.init()
      hts.set(tableName, ht)
    } else {
      const error = new Error("Forbidden: Client-Name")
      error.code = 403
      throw error
    }
  }
  return ht
}

/**
 * @name databaseHandler
 *
 * @docs
 * ```specscript
 * module DiskHashTable "https://presidium.services/docs/DiskHashTable"
 * module HTTP "https://presidium.services/docs/HTTP"
 *
 * databaseHandler(HTTP.Request, HTTP.Response) -> ()
 * ```
 */
async function databaseHandler(request, response) {
  const { pathname } = new URL(`http://*${request.url}`)
  request.path = decodeURIComponent(
    pathname == "/" ? pathname
    : pathname.endsWith("/") ? pathname.slice(0, -1)
    : pathname
  )
  request.pathSegments = request.path.slice(1).split("/")
  request.pathDepth = request.pathSegments.length

  const tableName = request.pathSegments[0]
  const fname = request.pathSegments[1]
  const ht = this.hts.get(tableName) ?? await getHt.call(this, tableName, request)

  await switchCase(
    fname,

    eq("clear"), async () => {
      await ht.clear()
      response.writeHead(200, {
        "Content-Type": "text/plain",
      })
      response.end("OK")
    },

    eq("set"), async () => {
      const key = request.headers["key"]
      const sortValue = request.headers["sort-value"]
      const value = request.headers["content-type"] == "text/plain"
        ? await Readable.Text(request)
        : await Readable.Buffer(request)
      await ht.set(key, value, sortValue)
      response.writeHead(200, {
        "Content-Type": "text/plain",
      })
      response.end("OK")
    },

    eq("get"), async () => {
      const key = request.headers["key"]
      const value = await ht.get(key)
      if (value === undefined) {
        response.writeHead(499, {
          "Content-Type": "text/plain",
        })
        response.end("Resource Not Found")
      } else {
        response.writeHead(200, {
          "Content-Type": "text/plain",
        })
        response.end(value)
      }
    },

    eq("getBinary"), async () => {
      const key = request.headers["key"]
      const value = await ht.getBinary(key)
      response.writeHead(200, {
        "Content-Type": "application/octet-stream",
      })
      response.end(value)
    },

    eq("delete"), async () => {
      const key = request.headers["key"]
      const didDelete = await ht.delete(key)
      response.writeHead(200, {
        "Content-Type": "text/plain",
      })
      response.end(String(didDelete))
    },

    eq("count"), async () => {
      const count = ht.count()
      response.writeHead(200, {
        "Content-Type": "text/plain",
      })
      response.end(String(count))
    },

    eq("iterator"), async () => {
      const valueType = request.headers["value-type"]
      const options = filter({ valueType }, __)
      response.writeHead(200, {
        "Content-Type": "application/octet-stream",
        "Content-Encoding": "utf8",
      })
      const count = ht.count()
      for await (const value of ht.iterator(options)) {
        response.write(value)
        response.write("")
      }
      response.end()
    },

    eq("entriesIterator"), async () => {
      const valueType = request.headers["value-type"]
      const options = filter({ valueType }, __)
      response.writeHead(200, {
        "Content-Type": "application/octet-stream",
        "Content-Encoding": "utf8",
      })
      const count = ht.count()
      for await (const [key, value] of ht.entriesIterator(options)) {
        response.write(key)
        response.write("")
        response.write(value)
        response.write("")
      }
      response.end()
    },

    eq("forwardIterator"), async () => {
      const valueType = request.headers["value-type"]
      const exclusiveStartKey = request.headers["exclusive-start-key"]
      const startingSortValue = request.headers["starting-sort-value"]
      const endingSortValue = request.headers["ending-sort-value"]
      const options = filter({
        valueType,
        exclusiveStartKey,
        startingSortValue,
        endingSortValue,
      }, __)

      response.writeHead(200, {
        "Content-Type": "application/octet-stream",
        "Content-Encoding": "utf8",
      })
      const count = ht.count()
      for await (const value of ht.forwardIterator(options)) {
        response.write(value)
        response.write("")
      }
      response.end()
    },

    eq("reverseIterator"), async () => {
      const valueType = request.headers["value-type"]
      const exclusiveStartKey = request.headers["exclusive-start-key"]
      const startingSortValue = request.headers["starting-sort-value"]
      const endingSortValue = request.headers["ending-sort-value"]
      const options = filter({
        valueType,
        exclusiveStartKey,
        startingSortValue,
        endingSortValue,
      }, __)

      response.writeHead(200, {
        "Content-Type": "application/octet-stream",
        "Content-Encoding": "utf8",
      })
      const count = ht.count()
      for await (const value of ht.reverseIterator(options)) {
        response.write(value)
        response.write("")
      }
      response.end()
    },

    eq("forwardEntriesIterator"), async () => {
      const valueType = request.headers["value-type"]
      const exclusiveStartKey = request.headers["exclusive-start-key"]
      const startingSortValue = request.headers["starting-sort-value"]
      const endingSortValue = request.headers["ending-sort-value"]
      const options = filter({
        valueType,
        exclusiveStartKey,
        startingSortValue,
        endingSortValue,
      }, __)

      response.writeHead(200, {
        "Content-Type": "application/octet-stream",
        "Content-Encoding": "utf8",
      })
      const count = ht.count()
      for await (const [key, value, sortValue] of ht.forwardEntriesIterator(options)) {
        response.write(key)
        response.write("")
        response.write(value)
        response.write("")
        response.write(String(sortValue))
        response.write("")
      }
      response.end()
    },

    eq("reverseEntriesIterator"), async () => {
      const valueType = request.headers["value-type"]
      const exclusiveStartKey = request.headers["exclusive-start-key"]
      const startingSortValue = request.headers["starting-sort-value"]
      const endingSortValue = request.headers["ending-sort-value"]
      const options = filter({
        valueType,
        exclusiveStartKey,
        startingSortValue,
        endingSortValue,
      }, __)

      response.writeHead(200, {
        "Content-Type": "application/octet-stream",
        "Content-Encoding": "utf8",
      })
      const count = ht.count()
      for await (const [key, value, sortValue] of ht.reverseEntriesIterator(options)) {
        response.write(key)
        response.write("")
        response.write(value)
        response.write("")
        response.write(String(sortValue))
        response.write("")
      }
      response.end()
    },

    async () => {
      const error = new Error("Forbidden: Hash Table Method")
      error.code = "403"
      throw error
    },
  )

}

module.exports = databaseHandler
