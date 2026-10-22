/**
 * Presidium DB Client and Server may be freely distributed under the CFOSS license.
 */

require("rubico/global")
const HTTP = require("presidium/HTTP")
const handleServerResponse = require("./handleServerResponse")
const buffersToEntry = require("./buffersToEntry")
const parseString = require("./parseString")

/**
 * @name DiskSortedHashTableClient
 *
 * @docs
 * ```specscript
 * new DiskSortedHashTableClient(options {
 *   serverUrl: string,
 *   tableName: string,
 *   sortValueType: "string"|"number",
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
   * module DiskSortedHashTable "https://presidium.services/docs/DiskSortedHashTable"
   *
   * clear DiskSortedHashTable.clear
   * ```
   */
  async clear() {
    const response = await this.http.POST(`/${this.tableName}/clear`, {
      headers: {
        "Content-Type": "text/plain",
        "Client-Name": "DiskSortedHashTableClient",

        ...pipe(this, all({
          "Sort-Value-Type": get("sortValueType"),
          "Degree": get("degree"),
        }), filter(__), map(parseString)),

      },
    })
    return handleServerResponse(response)
  }

  /**
   * @name set
   *
   * @docs
   * ```specscript
   * module DiskSortedHashTable "https://presidium.services/docs/DiskSortedHashTable"
   *
   * set DiskSortedHashTable.set
   * ```
   */
  async set(key, value, sortValue) {
    const response = await this.http.POST(`/${this.tableName}/set`, {
      headers: {
        "Content-Type": Buffer.isBuffer(value)
          ? "application/octet-stream"
          : "text/plain",
        "Client-Name": "DiskSortedHashTableClient",
        "Key": key,
        "Sort-Value": sortValue,

        ...pipe(this, all({
          "Sort-Value-Type": get("sortValueType"),
          "Degree": get("degree"),
        }), filter(__), map(parseString)),

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
   * module DiskSortedHashTable "https://presidium.services/docs/DiskSortedHashTable"
   *
   * get DiskSortedHashTable.get
   * ```
   */
  async get(key) {
    const response = await this.http.POST(`/${this.tableName}/get`, {
      headers: {
        "Content-Type": "text/plain",
        "Client-Name": "DiskSortedHashTableClient",
        "Key": key,

        ...pipe(this, all({
          "Sort-Value-Type": get("sortValueType"),
          "Degree": get("degree"),
        }), filter(__), map(parseString)),

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
   * module DiskSortedHashTable "https://presidium.services/docs/DiskSortedHashTable"
   *
   * getBinary DiskSortedHashTable.getBinary
   * ```
   */
  async getBinary(key) {
    const response = await this.http.POST(`/${this.tableName}/getBinary`, {
      headers: {
        "Content-Type": "text/plain",
        "Client-Name": "DiskSortedHashTableClient",
        "Key": key,

        ...pipe(this, all({
          "Sort-Value-Type": get("sortValueType"),
          "Degree": get("degree"),
        }), filter(__), map(parseString)),

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
   *   startingSortValue: string|number,
   *   endingSortValue: string|number,
   *   valueType: 'string'|'binary',
   * }) -> values AsyncIterator<string|Buffer>
   * ```
   */
  async forwardIterator(options = {}) {
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
        }), filter(__), map(parseString)),

        ...pipe(this, all({
          "Sort-Value-Type": get("sortValueType"),
          "Degree": get("degree"),
        }), filter(__), map(parseString)),

      },
    })
    if (valueType == "binary") {
      return handleServerResponse(response, {
        binaryStream: true,
        delimiter: this.delimiter,
      })
    }
    return handleServerResponse(response, {
      textStream: true,
      delimiter: this.delimiter,
    })
  }

  /**
   * @name reverseIterator
   *
   * @docs
   * ```specscript
   * reverseIterator(options {
   *   exclusiveStartKey: string, 
   *   startingSortValue: string|number,
   *   endingSortValue: string|number,
   *   valueType: 'string'|'binary',
   * }) -> values AsyncIterator<string|Buffer>
   * ```
   */
  async reverseIterator(options = {}) {
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
        }), filter(__), map(parseString)),

        ...pipe(this, all({
          "Sort-Value-Type": get("sortValueType"),
          "Degree": get("degree"),
        }), filter(__), map(parseString)),

      },
    })
    if (valueType == "binary") {
      return handleServerResponse(response, {
        binaryStream: true,
        delimiter: this.delimiter,
      })
    }
    return handleServerResponse(response, {
      textStream: true,
      delimiter: this.delimiter,
    })
  }

  /**
   * @name forwardEntriesIterator
   *
   * @docs
   * ```specscript
   * forwardEntriesIterator(options {
   *   exclusiveStartKey: string, 
   *   startingSortValue: string|number,
   *   endingSortValue: string|number,
   *   valueType: 'string'|'binary',
   * }) -> values AsyncIterator<string|Buffer>
   * ```
   */
  async forwardEntriesIterator(options = {}) {
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
        }), filter(__), map(parseString)),

        ...pipe(this, all({
          "Sort-Value-Type": get("sortValueType"),
          "Degree": get("degree"),
        }), filter(__), map(parseString)),

      },
    })
    if (valueType == "binary") {
      const iter = await handleServerResponse(response, {
        binaryEntriesStream: true,
        delimiter: this.delimiter,
        entryLength: 3,
      })
      return map(iter, curry(buffersToEntry, __, 3, "utf8", valueType, this.sortValueType))
    }
    const iter = await handleServerResponse(response, {
      textEntriesStream: true,
      delimiter: this.delimiter,
      entryLength: 3,
    })
    return map(iter, curry(buffersToEntry, __, 3, "utf8", valueType, this.sortValueType))
  }

  /**
   * @name reverseEntriesIterator
   *
   * @docs
   * ```specscript
   * module DiskSortedHashTable "https://presidium.services/docs/DiskSortedHashTable"
   *
   * reverseEntriesIterator DiskSortedHashTable.reverseEntriesIterator
   * ```
   */
  async reverseEntriesIterator(options = {}) {
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
        }), filter(__), map(parseString)),

        ...pipe(this, all({
          "Sort-Value-Type": get("sortValueType"),
          "Degree": get("degree"),
        }), filter(__), map(parseString)),

      },
    })

    if (valueType == "binary") {
      const iter = await handleServerResponse(response, {
        binaryEntriesStream: true,
        delimiter: this.delimiter,
        entryLength: 3,
      })
      return map(iter, curry(buffersToEntry, __, 3, "utf8", valueType, this.sortValueType))
    }
    const iter = await handleServerResponse(response, {
      textEntriesStream: true,
      delimiter: this.delimiter,
      entryLength: 3,
    })
    return map(iter, curry(buffersToEntry, __, 3, "utf8", valueType, this.sortValueType))
  }

  /**
   * @name delete
   *
   * @docs
   * ```specscript
   * module DiskSortedHashTable "https://presidium.services/docs/DiskSortedHashTable"
   *
   * delete DiskSortedHashTable.delete
   * ```
   */
  async delete(key) {
    const response = await this.http.POST(`/${this.tableName}/delete`, {
      headers: {
        "Content-Type": "text/plain",
        "Client-Name": "DiskSortedHashTableClient",
        "Key": key,

        ...pipe(this, all({
          "Sort-Value-Type": get("sortValueType"),
          "Degree": get("degree"),
        }), filter(__), map(parseString)),

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

        ...pipe(this, all({
          "Sort-Value-Type": get("sortValueType"),
          "Degree": get("degree"),
        }), filter(__), map(parseString)),

      },
    })
    return Number(await handleServerResponse(response))
  }
}

module.exports = DiskSortedHashTableClient
