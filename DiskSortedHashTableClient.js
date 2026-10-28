/**
 * Presidium DB Client and Server may be freely distributed under the CFOSS license.
 */

require("rubico/global")
const HTTP = require("presidium/HTTP")
const handleServerResponse = require("./handleServerResponse")
const buffersToEntry = require("./buffersToEntry")
const parseString = require("./parseString")
const toString = require("./toString")

/**
 * @name DiskSortedHashTableClient
 *
 * @docs
 * ```specscript
 * new DiskSortedHashTableClient(options {
 *   serverUrl: string,
 *   tableName: string,
 *   sortValueType: "string"|"number"|Array<"string"|"number">,
 *   degree: number,
 *   delimiter: string,
 * }) -> DiskSortedHashTableClient
 * ```
 */
class DiskSortedHashTableClient {
  constructor(options) {
    this.serverUrl = options.serverUrl
    this.tableName = options.tableName
    this.sortValueType = options.sortValueType
    this.degree = options.degree
    this.delimiter = options.delimiter ?? ""
    this.http = new HTTP(this.serverUrl)
  }

  /**
   * @name clear
   *
   * @docs
   * ```specscript
   * clear() -> Promise<>
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
   * forwardEntriesIterator() -> entries AsyncGenerator<[
   *   key string,
   *   value string|Buffer,
   *   sortValue string|number,
   * ]>
   *
   * forwardEntriesIterator() -> entries AsyncGenerator<[
   *   key string,
   *   value string|Buffer,
   *   ...sortValue Array<string|number>,
   * ]>
   *
   * forwardEntriesIterator(options) -> entries AsyncGenerator<[
   *   key string,
   *   value string|Buffer,
   *   sortValue string|number,
   * ]>
   *
   * forwardEntriesIterator(options) -> entries AsyncGenerator<[
   *   key string,
   *   value string|Buffer,
   *   ...sortValue Array<string|number>,
   * ]>
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
   * reverseEntriesIterator() -> entries AsyncGenerator<[
   *   key string,
   *   value string|Buffer,
   *   sortValue string|number,
   * ]>
   *
   * reverseEntriesIterator() -> entries AsyncGenerator<[
   *   key string,
   *   value string|Buffer,
   *   ...sortValue Array<string|number>,
   * ]>
   *
   * reverseEntriesIterator(options) -> entries AsyncGenerator<[
   *   key string,
   *   value string|Buffer,
   *   sortValue string|number,
   * ]>
   *
   * reverseEntriesIterator(options) -> entries AsyncGenerator<[
   *   key string,
   *   value string|Buffer,
   *   ...sortValue Array<string|number>,
   * ]>
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
