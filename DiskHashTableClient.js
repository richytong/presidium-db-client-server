/**
 * Presidium DB Client and Server may be freely distributed under the CFOSS license.
 */

require("rubico/global")
const HTTP = require("presidium/HTTP")
const Readable = require("presidium/Readable")
const handleServerResponse = require("./handleServerResponse")
const buffersToEntry = require("./buffersToEntry")
const exists = require("./exists")

/**
 * @name DiskHashTableClient
 *
 * @docs
 * ```specscript
 * new DiskHashTableClient(options {
 *   serverUrl: string,
 *   tableName: string,
 *   delimiter: string,
 *   initialLength: number,
 *   itemSize: number,
 *   resizeRatio: number,
 *   resizeFactor: number,
 * }) -> ht DiskHashTableClient
 * ```
 *
 * Presidium DiskHashTableClient class. Creates a disk hash table client that represents a Presidium [DiskHashTable](/docs/DiskHashTable) instance on a database server.
 *
 * Arguments:
 *   * `options`
 *     * `serverUrl` - `string` - the url of the database server.
 *     * `tableName` - `string` - the name of the DiskHashTable instance on the database server.
 *     * `delimiter` - `string` - a character or string that will separate chunks of data as they are sent to the database client. Defaults to the escape character "^[".
 *     * `initialLength` - `number` - the initial length of the disk hash table. Minimum value 1, maximum value `Math.floor(9007199254740991 / itemSize)`. Defaults to 1024.
 *     * `itemSize` - `number` - the size in bytes of each item (including internal item info, key, and value) stored on disk. Minimum value 17. Defaults to 524288.
 *     * `resizeRatio` - `number` - the ratio of number of items to table length at which to resize the disk hash table. Minimum value 0 (no resize), maximum value 1. Defaults to 0.
 *     * `resizeFactor` - `number` - the factor that is multiplied with the disk hash table's current length to determine the new table length on a resize.
 *
 * Return:
 *   * `ht` - [`DiskHashTableClient`](/docs/DiskHashTableClient) - a DiskHashTableClient instance.
 *
 * ```javascript
 * const ht = new DiskHashTableClient({
 *   serverUrl: "http://your-database-load-balancer-server:8080",
 *   tableName: "Profile",
 *   initialLength: 1073741824,
 *   itemSize: 4096,
 * })
 * ```
 */
class DiskHashTableClient {
  constructor(options) {
    this.serverUrl = options.serverUrl
    this.tableName = options.tableName
    this.initialLength = options.initialLength
    this.itemSize = options.itemSize
    this.delimiter = options.delimiter ?? ""
    this.resizeRatio = options.resizeRatio ?? 0
    this.resizeFactor = options.resizeFactor ?? 4
    this.http = new HTTP(this.serverUrl)
  }

  /**
   * @name register
   *
   * @docs
   * ```specscript
   * register() -> Promise<>
   * ```
   *
   * Registers and initializes a [DiskHashTable](/docs/DiskHashTable) instance on the database server.
   *
   * Arguments:
   *   * (none)
   *
   * Return:
   *   * Empty promise.
   *
   * ```javascript
   * await ht.register()
   * ```
   */
  async register() {
    const config = filter({
      initialLength: this.initialLength,
      itemSize: this.itemSize,
      resizeRatio: this.resizeRatio,
      resizeFactor: this.resizeFactor,
    }, exists)

    const response = await this.http.POST(`/${this.tableName}/register`, {
      headers: {
        "Content-Type": "application/json",
        "Client-Name": "DiskHashTableClient",
      },
      body: JSON.stringify(config),
    })
    await handleServerResponse(response)
  }

  /**
   * @name clear
   *
   * @docs
   * ```specscript
   * clear() -> Promise<>
   * ```
   *
   * Clears all data from the disk hash table on the database server. Reallocates the header and storage files.
   *
   * Arguments:
   *   * (none)
   *
   * Return:
   *   * Empty promise.
   *
   * ```javascript
   * await ht.clear()
   * ```
   */
  async clear() {
    const response = await this.http.POST(`/${this.tableName}/clear`, {
      headers: {
        "Content-Type": "text/plain",
        "Client-Name": "DiskHashTableClient",
      },
    })
    return handleServerResponse(response)
  }

  /**
   * @name set
   *
   * @docs
   * ```specscript
   * set(key string, value string|Buffer|Uint8Array) -> Promise<>
   * ```
   *
   * Sets and stores a value by key in the disk hash table on the database server.
   *
   * Arguments:
   *   * `key` - `string` - the key to set.
   *   * `value` - `string|Buffer|Uint8Array` - the value to set corresponding to the key.
   *
   * Return:
   *   * Empty promise.
   *
   * ```javascript
   * await ht.set('my-key', 'my-value')
   *
   * await ht.set('my-buffer', Buffer.from('binary'))
   * ```
   */
  async set(key, value) {
    const response = await this.http.POST(`/${this.tableName}/set`, {
      headers: {
        "Content-Type": Buffer.isBuffer(value)
          ? "application/octet-stream"
          : "text/plain",
        "Client-Name": "DiskHashTableClient",
        "Key": key,
      },
      body: value,
    })
    await handleServerResponse(response)
  }

  /**
   * @name get
   *
   * @docs
   * ```specscript
   * get(key string) -> value Promise<string|undefined>
   * ```
   *
   * Gets a value by key from the disk hash table on the database server.
   *
   * Arguments:
   *   * `key` - `string` - the key corresponding to the value.
   *
   * Return:
   *   * `value` - `string` - the value corresponding to the key.
   *
   * ```javascript
   * const value = await ht.get('my-key')
   * ```
   */
  async get(key) {
    const response = await this.http.POST(`/${this.tableName}/get`, {
      headers: {
        "Content-Type": "text/plain",
        "Client-Name": "DiskHashTableClient",
        "Key": key,
      },
    })
    if (response.status == 499) {
      return undefined
    }
    return handleServerResponse(response)
  }

  /**
   * @name getBinary
   *
   * @docs
   * ```specscript
   * getBinary(key string) -> binaryValue Promise<Buffer|undefined>
   * ```
   *
   * Gets a binary value by key from the disk hash table on the database server.
   *
   * Arguments:
   *   * `key` - `string` - the key corresponding to the binary value.
   *
   * Return:
   *   * `binaryValue` - `Buffer` - the binary value corresponding to the key.
   *
   * ```javascript
   * const buffer = await ht.getBinary('my-buffer')
   * ```
   */
  async getBinary(key) {
    const response = await this.http.POST(`/${this.tableName}/getBinary`, {
      headers: {
        "Content-Type": "text/plain",
        "Client-Name": "DiskHashTableClient",
        "Key": key,
      },
    })
    return handleServerResponse(response)
  }

  /**
   * @name delete
   *
   * @docs
   * ```specscript
   * delete(key string) -> didDelete Promise<boolean>
   * ```
   *
   * Deletes an item by key from the disk hash table on the database server.
   *
   * Arguments:
   *   * `key` - `string` - the key to delete.
   *
   * Return:
   *   * `didDelete` - `boolean` - a promise of whether the key and corresponding value were deleted.
   *
   * ```javascript
   * const didDelete = await ht.delete('my-key')
   * ```
   */
  async delete(key) {
    const response = await this.http.POST(`/${this.tableName}/delete`, {
      headers: {
        "Content-Type": "text/plain",
        "Client-Name": "DiskHashTableClient",
        "Key": key,
      },
    })
    const didDeleteText = await handleServerResponse(response)
    return didDeleteText == "true"
  }

  /**
   * @name count
   *
   * @docs
   * ```specscript
   * count() -> Promise<number>
   * ```
   *
   * Returns the number of items in the disk hash table on the database server.
   *
   * Arguments:
   *   * (none)
   *
   * Return:
   *   * `Promise<number>` - a promise of the number of items in the disk hash table on the database server.
   *
   * ```javascript
   * const count = ht.count()
   * ```
   */
  async count() {
    const response = await this.http.POST(`/${this.tableName}/count`, {
      headers: {
        "Content-Type": "text/plain",
        "Client-Name": "DiskHashTableClient",
      },
    })
    const scount = await handleServerResponse(response)
    return Number(scount)
  }

  /**
   * @name iterator
   *
   * @docs
   * ```specscript
   * iterator() -> values AsyncIterator<string>
   *
   * iterator(options {
   *   valueType: "string"|"binary",
   * }) -> values AsyncIterator<string|Buffer>
   * ```
   *
   * Returns an async iterator of the values of all items in the disk hash table on the database server. Item values are yielded in reverse insertion order.
   *
   * Arguments:
   *   * (none) - retrieves the values of all items in the disk hash table on the database server.
   *   * `options`
   *     * `valueType` - `'string'|'binary'` - the type of value that the async iterator yields. Defaults to `'string'`.
   *       * `'string'` - async iterator yields `string` values.
   *       * `'binary'` - async iterator yields `Buffer` values.
   *
   * Return:
   *   * `values` - `AsyncIterator<string|Buffer>` - an async iterator of the values of all items in the disk hash table on the database server sorted by reverse insertion order.
   *
   * ```javascript
   * await ht.set('key1', 'value1')
   * await ht.set('key2', 'value2')
   * await ht.set('key3', 'value3')
   *
   * for await (const value of ht.iterator()) {
   *   console.log(value) // value3
   *                      // value2
   *                      // value1
   * }
   * ```
   */
  async * iterator(options = {}) {
    const { valueType } = options
    const response = await this.http.POST(`/${this.tableName}/iterator`, {
      headers: {
        "Content-Type": "text/plain",
        "Client-Name": "DiskHashTableClient",
        ...valueType ? { "Value-Type": valueType } : {},
      },
    })
    if (valueType == "binary") {
      yield * await handleServerResponse(response, {
        binaryStream: true,
        delimiter: this.delimiter,
      })
    } else {
      yield * await handleServerResponse(response, {
        textStream: true,
        delimiter: this.delimiter,
      })
    }
  }

  /**
   * @name entriesIterator
   *
   * @docs
   * ```specscript
   * entriesIterator() -> entries AsyncIterator<[key string, value string]>
   *
   * entriesIterator(options {
   *   valueType: "string"|"binary",
   * }) -> entries AsyncIterator<[key string, value string|Buffer]>
   * ```
   *
   * Returns an async iterator of the entries (keys and values) of all items in the disk hash table on the database server. Item entries are yielded in reverse insertion order.
   *
   * Arguments:
   *   * (none) - retrieves the entries of all items in the disk hash table on the database server.
   *   * `options`
   *     * `valueType` - `'string'|'binary'` - the type of value that the async iterator yields. Defaults to `'string'`.
   *       * `'string'` - async iterator yields entries with `string` values.
   *       * `'binary'` - async iterator yields entries with `Buffer` values.
   *
   * Return:
   *   * `entries` - `AsyncIterator<[key string, value string|Buffer]>` - an async iterator of the entries of all items in the disk hash table on the database server sorted by reverse insertion order.
   *
   * ```javascript
   * await ht.set('key1', 'value1')
   * await ht.set('key2', 'value2')
   * await ht.set('key3', 'value3')
   *
   * for await (const [key, value] of ht.entriesIterator()) {
   *   console.log(key, value) // key3 value3
   *                           // key2 value2
   *                           // key1 value1
   * }
   * ```
   */
  async * entriesIterator(options = {}) {
    const { valueType } = options
    const response = await this.http.POST(`/${this.tableName}/entriesIterator`, {
      headers: {
        "Content-Type": "text/plain",
        "Client-Name": "DiskHashTableClient",
        ...valueType ? { "Value-Type": valueType } : {},
      },
    })

    if (valueType == "binary") {
      const iter = await handleServerResponse(response, {
        binaryEntriesStream: true,
        delimiter: this.delimiter,
        entryLength: 2,
      })
      yield* map(iter, curry.arity(4, buffersToEntry, __, 2, "utf8", valueType))
    } else {
      const iter = await handleServerResponse(response, {
        textEntriesStream: true,
        delimiter: this.delimiter,
        entryLength: 2,
      })
      yield* map(iter, curry.arity(4, buffersToEntry, __, 2, "utf8", valueType))
    }
  }
}

module.exports = DiskHashTableClient
