/**
 * Presidium DB Client and Server may be freely distributed under the CFOSS license.
 */

require("rubico/global")
const HTTP = require("presidium/HTTP")
const handleServerResponse = require("./handleServerResponse")
const buffersToEntry = require("./buffersToEntry")
const parseString = require("./parseString")
const toString = require("./toString")
const exists = require("./exists")

/**
 * @name DiskSortedHashTableClient
 *
 * @docs
 * ```specscript
 * new DiskSortedHashTableClient(options {
 *   serverUrl: string,
 *   tableName: string,
 *   delimiter: string,
 *   initialLength: number,
 *   itemSize: number,
 *   sortValueType: "string"|"number"|Array<"string"|"number">,
 *   resizeRatio: number,
 *   resizeFactor: number,
 *   degree: number,
 * }) -> DiskSortedHashTableClient
 * ```
 *
 * Presidium DiskSortedHashTableClient class. Creates a disk sorted hash table client that represents a Presidium [DiskSortedHashTable](/docs/DiskSortedHashTable) instance on a database server.
 *
 * Arguments:
 *   * `options`
 *     * `serverUrl` - `string` - the url of the database server.
 *     * `tableName` - `string` - the name of the DiskSortedHashTable instance on the database server.
 *     * `delimiter` - `string` - a character or string that will separate chunks of data as they are sent to the database client. Defaults to the escape character "^[".
 *     * `initialLength` - `number` - the initial length of the disk sorted hash table. Minimum value 1, maximum value `Math.floor(9007199254740991 / itemSize)`. Defaults to 1024.
 *     * `itemSize` - `number` - the size in bytes of each item (including internal item info, key, value, and sortValue) stored on disk. Minimum value 54. Defaults to 524288.
 *     * `sortValueType` - `"string"|"number"|Array<"string"|"number">` - the type of the disk sorted hash table sort values. If this value is an array, the sort value will be treated as a composite sort value. A composite sort value has each element of the array compared in order.
 *     * `resizeRatio` - `number` - the ratio of number of items to table length at which to resize the disk sorted hash table. Minimum value 0 (no resize), maximum value 1. Defaults to 0.
 *     * `resizeFactor` - `number` - the factor that is multiplied with the disk sorted hash table's current length to determine the new table length on a resize.
 *     * `degree` - `number` - minimum value 2, defaults to 2 - defines the following parameters for the internal b-tree that organizes all of the items in the disk sorted hash table:
 *       * Minimum number of items per b-tree node: `degree - 1`
 *       * Maximum number of items per b-tree node: `(2 * degree) - 1`
 *       * Minimum number of children per b-tree node: `degree`
 *       * Maximum number of children per b-tree node: `2 * degree`
 *
 * Return:
 *   * `ht` - [`DiskSortedHashTableClient`](/docs/DiskSortedHashTableClient) - a DiskSortedHashTableClient instance.
 *
 * ```javascript
 * const ht = new DiskSortedHashTableClient({
 *   serverUrl: "http://your-database-load-balancer-server:8080",
 *   tableName: "Post",
 *   initialLength: 1073741824,
 *   sortValueType: ["string", "number"],
 *   itemSize: 5120,
 *   degree: 2,
 * })
 * ```
 */
class DiskSortedHashTableClient {
  constructor(options) {
    this.serverUrl = options.serverUrl
    this.tableName = options.tableName
    this.initialLength = options.initialLength
    this.itemSize = options.itemSize
    this.sortValueType = options.sortValueType
    this.degree = options.degree ?? 2
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
   * Registers and initializes a [DiskSortedHashTable](/docs/DiskSortedHashTable) instance on the database server.
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
      sortValueType: this.sortValueType,
      degree: this.degree,
      resizeRatio: this.resizeRatio,
      resizeFactor: this.resizeFactor,
    }, exists)

    const response = await this.http.POST(`/${this.tableName}/register`, {
      headers: {
        "Content-Type": "application/json",
        "Client-Name": "DiskSortedHashTableClient",
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
   * Clears all data from the disk sorted hash table on the database server. Reallocates the header and storage files.
   *
   * Arguments:
   *   * (none)
   *
   * Return:
   *   * Empty promise.
   *
   * ```javascript
   * await sortedHt.clear()
   * ```
   */
  async clear() {
    const response = await this.http.POST(`/${this.tableName}/clear`, {
      headers: {
        "Content-Type": "text/plain",
        "Client-Name": "DiskSortedHashTableClient",

        ...pipe({
          "Sort-Value-Type": this.sortValueType,
          "Degree": this.degree,
        }, filter(__), map.call(toString, this), map(escape))

      },
    })
    return handleServerResponse(response)
  }

  /**
   * @name set
   *
   * @docs
   * ```specscript
   * set(key string, value string|Buffer|Uint8Array, sortValue string|number) -> Promise<>
   *
   * set(key string, value string|Buffer|Uint8Array, ...sortValue Array<string|number>) -> Promise<>
   * ```
   *
   * Sets and stores a value by key and sort value in the disk sorted hash table on the database server.
   *
   * Arguments:
   *   * `key` - `string` - the key to set.
   *   * `value` - `string|Buffer|Uint8Array` - the value to set corresponding to the key.
   *   * `sortValues` - `Arguments<string|number>` - values by which the item is indexed and sorted in the disk sorted hash table on the database server. If multiple sort values are provided, the sort values are treated as a composite sort value. Composite sort values have each element of their arrays compared in order.
   *
   * Return:
   *   * Empty promise.
   *
   * ```javascript
   * await ht.set("key1", "value1", 1)
   * await ht.set("key2", "value2", 2)
   * await ht.set("key3", "value3", 3)
   *
   * await ht.set("my-buffer", Buffer.from("binary"), 4)
   *
   * await compositeSortValueHt.set("key1", "value1", "index-key1", 1)
   * await compositeSortValueHt.set("key2", "value2", "index-key1", 2)
   * await compositeSortValueHt.set("key3", "value3", "index-key1", 3)
   * ```
   */
  async set(key, value, ...sortValue) {
    const response = await this.http.POST(`/${this.tableName}/set`, {
      headers: {
        "Content-Type": Buffer.isBuffer(value)
          ? "application/octet-stream"
          : "text/plain",
        "Client-Name": "DiskSortedHashTableClient",
        "Key": key,
        "Sort-Value": escape(toString.call(this, sortValue)),

        ...pipe({
          "Sort-Value-Type": this.sortValueType,
          "Degree": this.degree,
        }, filter(__), map.call(toString, this), map(escape))

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
   * Gets a value by key from the disk sorted hash table on the database server.
   *
   * Arguments:
   *   * `key` - `string` - the key corresponding to the value.
   *
   * Return:
   *   * `value` - `Promise<string|undefined>` - a promise of the string value corresponding to the key. If the key is not found, the promise resolves with `undefined`.
   *
   * ```javascript
   * const value = await ht.get("my-key")
   * ```
   */
  async get(key) {
    const response = await this.http.POST(`/${this.tableName}/get`, {
      headers: {
        "Content-Type": "text/plain",
        "Client-Name": "DiskSortedHashTableClient",
        "Key": key,

        ...pipe({
          "Sort-Value-Type": this.sortValueType,
          "Degree": this.degree,
        }, filter(__), map.call(toString, this), map(escape))

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
   * Gets a binary value by key from the disk sorted hash table on the database server.
   *
   * Arguments:
   *   * `key` - `string` - the key corresponding to the binary value.
   *
   * Return:
   *   * `binaryValue` - `Promise<Buffer|undefined>` - a promise of the binary value corresponding to the key. If the key is not found, the promise resolves with `undefined`.
   *
   * ```javascript
   * const buffer = await ht.getBinary("my-buffer")
   * ```
   */
  async getBinary(key) {
    const response = await this.http.POST(`/${this.tableName}/getBinary`, {
      headers: {
        "Content-Type": "text/plain",
        "Client-Name": "DiskSortedHashTableClient",
        "Key": key,

        ...pipe({
          "Sort-Value-Type": this.sortValueType,
          "Degree": this.degree,
        }, filter(__), map.call(toString, this), map(escape))

      },
    })
    return handleServerResponse(response)
  }

  /**
   * @name forwardIterator
   *
   * @docs
   * ```specscript
   * forwardIterator(options {
   *   exclusiveStartKey: string, 
   *   startingSortValue: string|number|Array<string|number>,
   *   endingSortValue: string|number|Array<string|number>,
   *   valueType: "string"|"binary",
   *   limit: number,
   * }) -> values AsyncIterator<string|Buffer>
   * ```
   *
   * Returns an async iterator of the values of all items in the disk sorted hash table on the database server sorted by sort value. Item values are yielded in ascending order.
   *
   * If a starting sort value and ending sort value are provided, the async iterator returns only values of items with sort values between the starting and ending sort values, including values of items with sort values equal to the starting and ending sort values. If only a starting sort value is provided, the async iterator returns values of items with sort values greater than or equal to the starting sort value. If only an ending sort value is provided, the async iterator returns values of items with sort values less than or equal to the ending sort value.
   *
   * If an exclusive start key is provided, the async iterator returns values of items with sort values greater than or equal to the sort value of the item at the exclusive start key, not including the value of the item at the exclusive start key. The exclusive start key takes precedence over the starting sort value.
   *
   * Arguments:
   *   * (none) - retrieves the values of all items in the disk sorted hash table on the database server.
   *   * `options`
   *     * `exclusiveStartKey` - `string` - the key after which to start iterating.
   *     * `startingSortValue` - `string|number|Array<string|number>` - the sort value from which to start iterating. If this value is an array, the starting sort value is treated as a composite sort value. Composite sort values have each element of their arrays compared in order.
   *     * `endingSortValue` - `string|number|Array<string|number>` - the sort value at which to stop iterating. If this value is an array, the ending sort value is treated as a composite sort value. Composite sort values have each element of their arrays compared in order.
   *     * `valueType` - `"string"|"binary"` - the type of value that the async iterator yields. Defaults to `"string"`.
   *       * `"string"` - async iterator yields `string` values.
   *       * `"binary"` - async iterator yields `Buffer` values.
   *     * `limit` - `number` - the maximum number of values to yield from the async iterator.
   *
   * Return:
   *   * `values` - `AsyncIterator<string|Buffer>` - an async iterator of the values of all items in the disk sorted hash table on the database server sorted by sort value in ascending order.
   *
   * ```javascript
   * await ht.set("key1", "value1", 1)
   * await ht.set("key2", "value2", 2)
   * await ht.set("key3", "value3", 3)
   *
   * for await (const value of ht.forwardIterator()) {
   *   console.log(value) // value1
   *                      // value2
   *                      // value3
   * }
   *
   * for await (const value of ht.forwardIterator({ limit: 1 })) {
   *   console.log(value) // value1
   * }
   *
   * for await (const value of ht.forwardIterator({ startingSortValue: 2, endingSortValue: 3 })) {
   *   console.log(value) // value2
   *                      // value3
   * }
   *
   * for await (const value of ht.forwardIterator({ exclusiveStartKey: "key1" })) {
   *   console.log(value) // value2
   *                      // value3
   * }
   *
   * for await (const value of ht.forwardIterator({ exclusiveStartKey: "key1", endingSortValue: 2 })) {
   *   console.log(value) // value2
   * }
   *
   * await compositeSortValueHt.set("key1", "value1", "index-key1", 1)
   * await compositeSortValueHt.set("key2", "value2", "index-key1", 2)
   * await compositeSortValueHt.set("key3", "value3", "index-key1", 3)
   *
   * for await (const value of compositeSortValueHt.forwardIterator({
   *   startingSortValue: ["index-key1", 2],
   *   endingSortValue: ["index-key1", 3],
   * })) {
   *   console.log(value) // value2
   *                      // value3
   * }
   * ```
   */
  async * forwardIterator(options = {}) {
    const { valueType } = options
    const response = await this.http.POST(`/${this.tableName}/forwardIterator`, {
      headers: {
        "Content-Type": "text/plain",
        "Client-Name": "DiskSortedHashTableClient",

        ...pipe(options, all({
          "Exclusive-Start-Key": get("exclusiveStartKey"),
          "Starting-Sort-Value": get("startingSortValue"),
          "Ending-Sort-Value": get("endingSortValue"),
          "Value-Type": get("valueType"),
          "Limit": get("limit"),
        }), filter(__), map.call(toString, this), map(escape)),

        ...pipe({
          "Sort-Value-Type": this.sortValueType,
          "Degree": this.degree,
        }, filter(__), map.call(toString, this), map(escape))

      },
    })
    if (valueType == "binary") {
      yield* await handleServerResponse(response, {
        binaryStream: true,
        delimiter: this.delimiter,
      })
    } else {
      yield* await handleServerResponse(response, {
        textStream: true,
        delimiter: this.delimiter,
      })
    }
  }

  /**
   * @name reverseIterator
   *
   * @docs
   * ```specscript
   * reverseIterator(options {
   *   exclusiveStartKey: string, 
   *   startingSortValue: string|number|Array<string|number>,
   *   endingSortValue: string|number|Array<string|number>,
   *   valueType: "string"|"binary",
   *   limit: number,
   * }) -> values AsyncIterator<string|Buffer>
   * ```
   *
   * Returns an async iterator of the values of all items in the disk sorted hash table on the database server sorted by sort value. Item values are yielded in descending order.
   *
   * If a starting sort value and ending sort value are provided, the async iterator returns only values of items with sort values between the starting and ending sort values, including values of items with sort values equal to the starting and ending sort values. If only a starting sort value is provided, the async iterator returns values of items with sort values less than or equal to the starting sort value.
   *
   * If an exclusive start key is provided, the async iterator returns values of items with sort values less than or equal to the sort value of the item at the exclusive start key, not including the value of the item at the exclusive start key. The exclusive start key takes precedence over the starting sort value.
   *
   * Arguments:
   *   * (none) - retrieves the values of all items in the disk sorted hash table on the database server.
   *   * `options`
   *     * `exclusiveStartKey` - `string` - the key after which to start iterating.
   *     * `startingSortValue` - `string|number|Array<string|number>` - the sort value from which to start iterating. If this value is an array, the starting sort value is treated as a composite sort value. Composite sort values have each element of their arrays compared in order.
   *     * `endingSortValue` - `string|number|Array<string|number>` - the sort value at which to stop iterating. If this value is an array, the ending sort value is treated as a composite sort value. Composite sort values have each element of their arrays compared in order.
   *     * `valueType` - `"string"|"binary"` - the type of value that the async iterator yields. Defaults to `"string"`.
   *       * `string` - async iterator yields `string` values.
   *       * `binary` - async iterator yields `Buffer` values.
   *     * `limit` - `number` - the maximum number of values to yield from the async iterator.
   *
   * Return:
   *   * `values` - `AsyncIterator<string|Buffer>` - an async iterator of the values of all items in the disk sorted hash table on the database server sorted by sort value in descending order.
   *
   * ```javascript
   * await ht.set("key1", "value1", 1)
   * await ht.set("key2", "value2", 2)
   * await ht.set("key3", "value3", 3)
   *
   * for await (const value of ht.reverseIterator()) {
   *   console.log(value) // value3
   *                      // value2
   *                      // value1
   * }
   *
   * for await (const value of ht.reverseIterator({ limit: 1 })) {
   *   console.log(value) // value3
   * }
   *
   * for await (const value of ht.reverseIterator({ startingSortValue: 2, endingSortValue: 1 })) {
   *   console.log(value) // value2
   *                      // value1
   * }
   *
   * for await (const value of ht.reverseIterator({ exclusiveStartKey: "key3" })) {
   *   console.log(value) // value2
   *                      // value1
   * }
   *
   * for await (const value of ht.reverseIterator({ exclusiveStartKey: "key3", endingSortValue: 2 })) {
   *   console.log(value) // value2
   * }
   *
   * await compositeSortValueHt.set("key1", "value1", "index-key1", 1)
   * await compositeSortValueHt.set("key2", "value2", "index-key1", 2)
   * await compositeSortValueHt.set("key3", "value3", "index-key1", 3)
   *
   * for await (const value of compositeSortValueHt.reverseIterator({
   *   startingSortValue: ["index-key1", 3],
   *   endingSortValue: ["index-key1", 2],
   * })) {
   *   console.log(value) // value3
   *                      // value2
   * }
   * ```
   */
  async * reverseIterator(options = {}) {
    const { valueType } = options
    const response = await this.http.POST(`/${this.tableName}/reverseIterator`, {
      headers: {
        "Content-Type": "text/plain",
        "Client-Name": "DiskSortedHashTableClient",

        ...pipe(options, all({
          "Exclusive-Start-Key": get("exclusiveStartKey"),
          "Starting-Sort-Value": get("startingSortValue"),
          "Ending-Sort-Value": get("endingSortValue"),
          "Value-Type": get("valueType"),
          "Limit": get("limit"),
        }), filter(__), map.call(toString, this), map(escape)),

        ...pipe({
          "Sort-Value-Type": this.sortValueType,
          "Degree": this.degree,
        }, filter(__), map.call(toString, this), map(escape))

      },
    })
    if (valueType == "binary") {
      yield* await handleServerResponse(response, {
        binaryStream: true,
        delimiter: this.delimiter,
      })
    } else {
      yield* await handleServerResponse(response, {
        textStream: true,
        delimiter: this.delimiter,
      })
    }
  }

  /**
   * @name forwardEntriesIterator
   *
   * @docs
   * ```specscript
   * options {
   *   exclusiveStartKey: string,
   *   startingSortValue: string|number|Array<string|number>,
   *   endingSortValue: string|number|Array<string|number>,
   *   valueType: "string"|"binary",
   *   limit: number,
   * }
   *
   * forwardEntriesIterator() -> entries AsyncIterator<[
   *   key string,
   *   value string|Buffer,
   *   sortValue string|number,
   * ]>
   *
   * forwardEntriesIterator() -> entries AsyncIterator<[
   *   key string,
   *   value string|Buffer,
   *   ...sortValue Array<string|number>,
   * ]>
   *
   * forwardEntriesIterator(options) -> entries AsyncIterator<[
   *   key string,
   *   value string|Buffer,
   *   sortValue string|number,
   * ]>
   *
   * forwardEntriesIterator(options) -> entries AsyncIterator<[
   *   key string,
   *   value string|Buffer,
   *   ...sortValue Array<string|number>,
   * ]>
   * ```
   *
   * Returns an async iterator of the entries (key, value, and sort value) of all items in the disk sorted hash table on the database server sorted by sort value. Item entries are yielded in ascending order.
   *
   * If a starting sort value and ending sort value are provided, the async iterator returns only entries of items with sort values between the starting and ending sort values, including entries of items with sort values equal to the starting and ending sort values. If only a starting sort value is provided, the async iterator returns entries of items with sort values greater than or equal to the starting sort value. If only an ending sort value is provided, the async iterator returns entries of items with sort values less than or equal to the ending sort value.
   *
   * If an exclusive start key is provided, the async iterator returns entries of items with sort values greater than or equal to the sort value of the item at the exclusive start key, not including the entry of the item at the exclusive start key. The exclusive start key takes precedence over the starting sort value.
   *
   * Arguments:
   *   * (none) - retrieves the entries of all items in the disk sorted hash table on the database server.
   *   * `options`
   *     * `exclusiveStartKey` - `string` - the key after which to start iterating.
   *     * `startingSortValue` - `string|number|Array<string|number>` - the sort value from which to start iterating. If this value is an array, the starting sort value is treated as a composite sort value. Composite sort values have each element of their arrays compared in order.
   *     * `endingSortValue` - `string|number|Array<string|number>` - the sort value at which to stop iterating. If this value is an array, the ending sort value is treated as a composite sort value. Composite sort values have each element of their arrays compared in order.
   *     * `valueType` - `"string"|"binary"` - the type of value that the async iterator yields. Defaults to `"string"`.
   *       * `"string"` - async iterator yields entries with `string` values.
   *       * `"binary"` - async iterator yields entries with `Buffer` values.
   *     * `limit` - `number` - the maximum number of entries to yield from the async iterator.
   *
   * Return:
   *   * `entries` - `AsyncIterator<[key string, value string|Buffer, sortValue string|number]>` - an async iterator of the entries of all items in the disk sorted hash table on the database server sorted by sort value in ascending order.
   *
   * ```javascript
   * await ht.set("key1", "value1", 1)
   * await ht.set("key2", "value2", 2)
   * await ht.set("key3", "value3", 3)
   *
   * for await (const [key, value, sortValue] of ht.forwardEntriesIterator()) {
   *   console.log(key, value, sortValue) // key1 value1 1
   *                                      // key2 value2 2
   *                                      // key3 value3 3
   * }
   *
   * for await (const [key, value, sortValue] of ht.forwardEntriesIterator({ limit: 1 })) {
   *   console.log(key, value, sortValue) // key1 value1 1
   * }
   *
   * for await (const [key, value, sortValue] of ht.forwardEntriesIterator({ startingSortValue: 2, endingSortValue: 3 })) {
   *   console.log(key, value, sortValue) // key2 value2 2
   *                                      // key3 value3 3
   * }
   *
   * for await (const [key, value, sortValue] of ht.forwardEntriesIterator({ exclusiveStartKey: "key1" })) {
   *   console.log(key, value, sortValue) // key2 value2 2
   *                                      // key3 value3 3
   * }
   *
   * for await (const [key, value, sortValue] of ht.forwardEntriesIterator({ exclusiveStartKey: "key1", endingSortValue: 2 })) {
   *   console.log(key, value, sortValue) // key2 value2 2
   * }
   *
   * await compositeSortValueHt.set("key1", "value1", "index-key1", 1)
   * await compositeSortValueHt.set("key2", "value2", "index-key1", 2)
   * await compositeSortValueHt.set("key3", "value3", "index-key1", 3)
   *
   * for await (const [key, value, ...sortValue] of compositeSortValueHt.forwardEntriesIterator({
   *   startingSortValue: ["index-key1", 2],
   *   endingSortValue: ["index-key1", 3],
   * })) {
   *   console.log(key, value, sortValue) // key2 value2 ["index-key1", 2]
   *                                      // key3 value3 ["index-key1", 3]
   * }
   * ```
   */
  async * forwardEntriesIterator(options = {}) {
    const { valueType } = options
    const response = await this.http.POST(`/${this.tableName}/forwardEntriesIterator`, {
      headers: {
        "Content-Type": "text/plain",
        "Client-Name": "DiskSortedHashTableClient",

        ...pipe(options, all({
          "Exclusive-Start-Key": get("exclusiveStartKey"),
          "Starting-Sort-Value": get("startingSortValue"),
          "Ending-Sort-Value": get("endingSortValue"),
          "Value-Type": get("valueType"),
          "Limit": get("limit"),
        }), filter(__), map.call(toString, this), map(escape)),

        ...pipe({
          "Sort-Value-Type": this.sortValueType,
          "Degree": this.degree,
        }, filter(__), map.call(toString, this), map(escape))

      },
    })

    const entryLength =
      Array.isArray(this.sortValueType)
      ? 2 + this.sortValueType.length
      : 3

    if (valueType == "binary") {
      const iter = await handleServerResponse(response, {
        binaryEntriesStream: true,
        delimiter: this.delimiter,
        entryLength,
      })
      yield* map(iter, curry(buffersToEntry, __, entryLength, "utf8", valueType, this.sortValueType))
    } else {
      const iter = await handleServerResponse(response, {
        textEntriesStream: true,
        delimiter: this.delimiter,
        entryLength,
      })
      yield* map(iter, curry(buffersToEntry, __, entryLength, "utf8", valueType, this.sortValueType))
    }
  }

  /**
   * @name reverseEntriesIterator
   *
   * @docs
   * ```specscript
   * options {
   *   exclusiveStartKey: string,
   *   startingSortValue: string|number|Array<string|number>,
   *   endingSortValue: string|number|Array<string|number>,
   *   valueType: "string"|"binary",
   *   limit: number,
   * }
   *
   * reverseEntriesIterator() -> entries AsyncIterator<[
   *   key string,
   *   value string|Buffer,
   *   sortValue string|number,
   * ]>
   *
   * reverseEntriesIterator() -> entries AsyncIterator<[
   *   key string,
   *   value string|Buffer,
   *   ...sortValue Array<string|number>,
   * ]>
   *
   * reverseEntriesIterator(options) -> entries AsyncIterator<[
   *   key string,
   *   value string|Buffer,
   *   sortValue string|number,
   * ]>
   *
   * reverseEntriesIterator(options) -> entries AsyncIterator<[
   *   key string,
   *   value string|Buffer,
   *   ...sortValue Array<string|number>,
   * ]>
   * ```
   *
   * Returns an async iterator of the entries (key, value, and sort value) of all items in the disk sorted hash table on the database server sorted by sort value. Item entries are yielded in descending order.
   *
   * If a starting sort value and ending sort value are provided, the async iterator returns only entries of items with sort values between the starting and ending sort values, including entries of items with sort values equal to the starting and ending sort values. If only a starting sort value is provided, the async iterator returns entries of items with sort values less than or equal to the starting sort value.
   *
   * If an exclusive start key is provided, the async iterator returns entries of items with sort values less than or equal to the sort value of the item at the exclusive start key, not including the entry of the item at the exclusive start key. The exclusive start key takes precedence over the starting sort value.
   *
   * Arguments:
   *   * (none) - retrieves the entries of all items in the disk sorted hash table on the database server.
   *   * `options`
   *     * `exclusiveStartKey` - `string` - the key after which to start iterating.
   *     * `startingSortValue` - `string|number|Array<string|number>` - the sort value from which to start iterating. If this value is an array, the starting sort value is treated as a composite sort value. Composite sort values have each element of their arrays compared in order.
   *     * `endingSortValue` - `string|number|Array<string|number>` - the sort value at which to stop iterating. If this value is an array, the ending sort value is treated as a composite sort value. Composite sort values have each element of their arrays compared in order.
   *     * `valueType` - `"string"|"binary"` - the type of value that the async iterator yields. Defaults to `"string"`.
   *       * `string` - async iterator yields entries with `string` values.
   *       * `binary` - async iterator yields entries with `Buffer` values.
   *     * `limit` - `number` - the maximum number of entries to yield from the async iterator.
   *
   * Return:
   *   * `entries` - `AsyncIterator<[key string, value string|Buffer, sortValue string|number]>` - an async iterator of the entries of all items in the disk sorted hash table on the database server sorted by sort value in descending order.
   *
   * ```javascript
   * await ht.set("key1", "value1", 1)
   * await ht.set("key2", "value2", 2)
   * await ht.set("key3", "value3", 3)
   *
   * for await (const [key, value, sortValue] of ht.reverseEntriesIterator()) {
   *   console.log(key, value, sortValue) // key3 value3 3
   *                                      // key2 value2 2
   *                                      // key1 value1 1
   * }
   *
   * for await (const [key, value, sortValue] of ht.reverseEntriesIterator({ limit: 1 })) {
   *   console.log(key, value, sortValue) // key3 value3 3
   * }
   *
   * for await (const [key, value, sortValue] of ht.reverseEntriesIterator({ startingSortValue: 2, endingSortValue: 1 })) {
   *   console.log(key, value, sortValue) // key2 value2 2
   *                                      // key1 value1 1
   * }
   *
   * for await (const [key, value, sortValue] of ht.reverseEntriesIterator({ exclusiveStartKey: "key3" })) {
   *   console.log(key, value, sortValue) // key2 value2 2
   *                                      // key1 value1 1
   * }
   *
   * for await (const [key, value, sortValue] of ht.reverseEntriesIterator({ exclusiveStartKey: "key3", endingSortValue: 2 })) {
   *   console.log(key, value, sortValue) // key2 value2 2
   * }
   *
   * await compositeSortValueHt.set("key1", "value1", "index-key1", 1)
   * await compositeSortValueHt.set("key2", "value2", "index-key1", 2)
   * await compositeSortValueHt.set("key3", "value3", "index-key1", 3)
   *
   * for await (const [key, value, ...sortValue] of compositeSortValueHt.reverseEntriesIterator({
   *   startingSortValue: ["index-key1", 3],
   *   endingSortValue: ["index-key1", 2],
   * })) {
   *   console.log(key, value, sortValue) // key2 value2 ["index-key1", 3]
   *                                      // key3 value3 ["index-key1", 2]
   * }
   * ```
   */
  async * reverseEntriesIterator(options = {}) {
    const { valueType } = options
    const response = await this.http.POST(`/${this.tableName}/reverseEntriesIterator`, {
      headers: {
        "Content-Type": "text/plain",
        "Client-Name": "DiskSortedHashTableClient",

        ...pipe(options, all({
          "Exclusive-Start-Key": get("exclusiveStartKey"),
          "Starting-Sort-Value": get("startingSortValue"),
          "Ending-Sort-Value": get("endingSortValue"),
          "Value-Type": get("valueType"),
          "Limit": get("limit"),
        }), filter(__), map.call(toString, this), map(escape)),

        ...pipe({
          "Sort-Value-Type": this.sortValueType,
          "Degree": this.degree,
        }, filter(__), map.call(toString, this), map(escape))

      },
    })

    const entryLength =
      Array.isArray(this.sortValueType)
      ? 2 + this.sortValueType.length
      : 3

    if (valueType == "binary") {
      const iter = await handleServerResponse(response, {
        binaryEntriesStream: true,
        delimiter: this.delimiter,
        entryLength,
      })
      yield* map(iter, curry(buffersToEntry, __, entryLength, "utf8", valueType, this.sortValueType))
    } else {
      const iter = await handleServerResponse(response, {
        textEntriesStream: true,
        delimiter: this.delimiter,
        entryLength,
      })
      yield* map(iter, curry(buffersToEntry, __, entryLength, "utf8", valueType, this.sortValueType))
    }
  }

  /**
   * @name delete
   *
   * @docs
   * ```specscript
   * delete(key string) -> didDelete Promise<boolean>
   * ```
   *
   * Deletes an item by key from the disk sorted hash table on the database server.
   *
   * Arguments:
   *   * `key` - `string` - the key to delete.
   *
   * Return:
   *   * `didDelete` - `boolean` - a promise of whether the key and corresponding value were deleted.
   *
   * ```javascript
   * const didDelete = await ht.delete("my-key")
   * ```
   */
  async delete(key) {
    const response = await this.http.POST(`/${this.tableName}/delete`, {
      headers: {
        "Content-Type": "text/plain",
        "Client-Name": "DiskSortedHashTableClient",
        "Key": key,

        ...pipe({
          "Sort-Value-Type": this.sortValueType,
          "Degree": this.degree,
        }, filter(__), map.call(toString, this), map(escape))

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
   * Returns the number of items in the disk sorted hash table on the database server.
   *
   * Arguments:
   *   * (none)
   *
   * Return:
   *   * `Promise<number>` - a promise of the number of items in the disk sorted hash table on the database server.
   *
   * ```javascript
   * const count = await ht.count()
   * ```
   */
  async count() {
    const response = await this.http.POST(`/${this.tableName}/count`, {
      headers: {
        "Content-Type": "text/plain",
        "Client-Name": "DiskSortedHashTableClient",

        ...pipe({
          "Sort-Value-Type": this.sortValueType,
          "Degree": this.degree,
        }, filter(__), map.call(toString, this), map(escape))

      },
    })
    return Number(await handleServerResponse(response))
  }
}

module.exports = DiskSortedHashTableClient
